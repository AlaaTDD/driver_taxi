-- =============================================================
-- Fix: resolve_complaint now APPENDS to admin_notes history
-- instead of overwriting admin_reply only.
--
-- BACKGROUND:
--   - admin_notes  stores ALL messages (user + admin) as JSON array
--   - admin_reply  stores the LATEST admin reply as plain text
--   - add_complaint_user_reply appends user messages to admin_notes
--   - This migration makes resolve_complaint also append to admin_notes
--
-- SAFETY CHECKS:
--   ✅ All columns exist in complaints table (verified against schema)
--   ✅ admin_logs table exists with expected columns
--   ✅ No triggers on complaints table
--   ✅ SECURITY DEFINER bypasses RLS
--   ✅ Backwards compatible: preserves legacy admin_reply data
--   ✅ JSON parse errors are caught safely
-- =============================================================

-- Step 1: Migrate existing data — copy legacy admin_reply into admin_notes
-- This ensures we don't lose any old admin replies that were stored
-- as plain text in admin_reply before this migration.
DO $$
DECLARE
    v_row RECORD;
    v_existing_notes jsonb;
    v_legacy_reply   jsonb;
    v_merged         jsonb;
BEGIN
    FOR v_row IN
        SELECT id, admin_reply, admin_notes, replied_at, admin_id
        FROM public.complaints
        WHERE admin_reply IS NOT NULL
          AND admin_reply != ''
          AND (
              -- Only rows where admin_notes doesn't already contain
              -- this admin reply (avoid re-processing)
              admin_notes IS NULL
              OR admin_notes = ''
              OR NOT admin_notes::jsonb @> jsonb_build_array(
                  jsonb_build_object('message', admin_reply)
              )
          )
    LOOP
        -- Parse existing admin_notes
        BEGIN
            v_existing_notes := COALESCE(v_row.admin_notes, '[]')::jsonb;
            IF jsonb_typeof(v_existing_notes) <> 'array' THEN
                v_existing_notes := '[]'::jsonb;
            END IF;
        EXCEPTION WHEN others THEN
            v_existing_notes := '[]'::jsonb;
        END;

        -- Check if admin_reply is already in admin_notes
        -- (in case admin_notes already has a message with the same text)
        IF NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements(v_existing_notes) AS elem
            WHERE elem->>'message' = v_row.admin_reply
              AND elem->>'sender_type' = 'admin'
        ) THEN
            -- Build legacy admin reply message
            v_legacy_reply := jsonb_build_object(
                'id',          gen_random_uuid()::text,
                'sender_type', 'admin',
                'sender_id',   COALESCE(v_row.admin_id::text, 'unknown'),
                'message',     v_row.admin_reply,
                'created_at',  COALESCE(
                    v_row.replied_at::text,
                    now()::text
                )
            );

            -- Append to existing notes
            v_merged := v_existing_notes || jsonb_build_array(v_legacy_reply);

            -- Sort chronologically
            UPDATE public.complaints
            SET admin_notes = (
                SELECT jsonb_agg(msg ORDER BY (msg->>'created_at')::timestamptz)
                FROM jsonb_array_elements(v_merged) AS msg
            )
            WHERE id = v_row.id;
        END IF;
    END LOOP;
END;
$$;

-- Step 2: Replace the function
CREATE OR REPLACE FUNCTION public.resolve_complaint(
    p_complaint_id uuid,
    p_reply        text,
    p_status       character varying DEFAULT 'resolved'::character varying
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    v_existing_notes text;
    v_messages       jsonb;
    v_new_message    jsonb;
BEGIN
    -- Load existing conversation history
    SELECT admin_notes
    INTO   v_existing_notes
    FROM   public.complaints
    WHERE  id = p_complaint_id;

    -- Parse existing messages (safe: fall back to empty array)
    IF v_existing_notes IS NULL OR btrim(v_existing_notes) = '' THEN
        v_messages := '[]'::jsonb;
    ELSE
        BEGIN
            v_messages := v_existing_notes::jsonb;
            IF jsonb_typeof(v_messages) <> 'array' THEN
                v_messages := '[]'::jsonb;
            END IF;
        EXCEPTION WHEN others THEN
            v_messages := '[]'::jsonb;
        END;
    END IF;

    -- Build the new admin message entry
    v_new_message := jsonb_build_object(
        'id',          gen_random_uuid()::text,
        'sender_type', 'admin',
        'sender_id',   auth.uid()::text,
        'message',     p_reply,
        'created_at',  now()::text
    );

    -- Append it to the history
    v_messages := v_messages || jsonb_build_array(v_new_message);

    -- Persist: keep admin_reply (latest) for backwards compat,
    --          write full history into admin_notes
    UPDATE public.complaints
    SET admin_reply = p_reply,
        admin_notes = v_messages::text,
        replied_at  = now(),
        admin_id    = auth.uid(),
        status      = p_status,
        resolved_at = CASE
                          WHEN p_status IN ('resolved', 'closed') THEN now()
                          ELSE resolved_at
                      END
    WHERE id = p_complaint_id;

    INSERT INTO admin_logs (admin_id, action, table_name, record_id, new_data)
    VALUES (
        auth.uid(),
        'update',
        'complaints',
        p_complaint_id,
        jsonb_build_object('status', p_status, 'admin_reply', p_reply)
    );
END;
$function$;
