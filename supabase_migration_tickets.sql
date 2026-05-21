-- إنشاء نوع لحالة التذكرة
CREATE TYPE ticket_status AS ENUM ('open', 'closed');

-- إنشاء جدول التذاكر
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status ticket_status NOT NULL DEFAULT 'open',
    subject TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تحديث جدول support_messages لإضافة ticket_id
ALTER TABLE public.support_messages 
ADD COLUMN ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE;

-- إنشاء وظيفة ومحفز (Trigger) لتحديث حقل updated_at
CREATE OR REPLACE FUNCTION update_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_tickets_modtime
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION update_ticket_updated_at();

-- ترحيل البيانات القديمة (اختياري، إنشاء تذكرة واحدة لكل مستخدم لديه رسائل سابقة وربط رسائله بها)
DO $$
DECLARE
    rec RECORD;
    new_ticket_id UUID;
BEGIN
    FOR rec IN (SELECT DISTINCT user_id FROM public.support_messages WHERE ticket_id IS NULL)
    LOOP
        -- إنشاء تذكرة للمستخدم
        INSERT INTO public.support_tickets (user_id, status, subject)
        VALUES (rec.user_id, 'closed', 'رسائل الدعم السابقة')
        RETURNING id INTO new_ticket_id;
        
        -- ربط الرسائل القديمة بالتذكرة الجديدة
        UPDATE public.support_messages
        SET ticket_id = new_ticket_id
        WHERE user_id = rec.user_id AND ticket_id IS NULL;
    END LOOP;
END $$;

-- إنشاء View لتجميع رسائل الرحلات
CREATE OR REPLACE VIEW public.trip_conversations_view WITH (security_invoker = true) AS
SELECT 
    m.trip_id,
    MAX(m.created_at) as last_message_at,
    COUNT(m.id) as message_count,
    (SELECT content FROM public.messages WHERE trip_id = m.trip_id ORDER BY created_at DESC LIMIT 1) as last_message,
    MAX(CASE WHEN m.is_read = false THEN 1 ELSE 0 END) as has_unread,
    t.driver_id,
    t.user_id as passenger_id
FROM public.messages m
JOIN public.trips t ON t.id = m.trip_id
GROUP BY m.trip_id, t.driver_id, t.user_id;
