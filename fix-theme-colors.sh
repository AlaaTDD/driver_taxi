#!/bin/bash
# Fix hardcoded dark-mode-only colors across all dashboard pages
# Replace with CSS variable references that work in both light and dark modes

DIR="/Volumes/alaaMac/driverr/taxi_web/src/app/dashboard"

# Find all .tsx files and fix them
for f in $(find "$DIR" -name "*.tsx" -type f); do
  # Replace white-alpha borders with var(--divider)
  sed -i '' 's|border: "1px solid rgba(255,255,255,0\.05)"|border: "1px solid var(--divider)"|g' "$f"
  sed -i '' 's|border: "1px solid rgba(255,255,255,0\.04)"|border: "1px solid var(--divider)"|g' "$f"
  sed -i '' 's|border: "1px solid rgba(255,255,255,0\.08)"|border: "1px solid var(--divider)"|g' "$f"
  sed -i '' 's|border: "1px solid rgba(255,255,255,0\.03)"|border: "1px solid var(--divider)"|g' "$f"
  
  # Replace dashed borders
  sed -i '' 's|borderBottom: "1px dashed rgba(255,255,255,0\.05)"|borderBottom: "1px dashed var(--divider)"|g' "$f"
  
  # Replace box shadows
  sed -i '' 's|boxShadow: "0 2px 12px rgba(0,0,0,0\.3), inset 0 1px 0 rgba(255,255,255,0\.03)"|boxShadow: "var(--shadow-md)"|g' "$f"
  sed -i '' 's|boxShadow: "0 2px 12px rgba(0,0,0,0\.3)"|boxShadow: "var(--shadow-md)"|g' "$f"
  sed -i '' 's|boxShadow: "0 4px 20px rgba(0,0,0,0\.2)"|boxShadow: "var(--shadow-lg)"|g' "$f"
  sed -i '' 's|boxShadow: "0 2px 8px rgba(0,0,0,0\.25)"|boxShadow: "var(--shadow-md)"|g' "$f"
  sed -i '' 's|boxShadow: "0 2px 10px rgba(0,0,0,0\.25), inset 0 1px 0 rgba(255,255,255,0\.04)"|boxShadow: "var(--shadow-md)"|g' "$f"
  
  # Replace hardcoded dark-mode row borders 
  sed -i '' 's|borderBottom: "1px solid rgba(26,45,71,0\.5)"|borderBottom: "1px solid var(--divider)"|g' "$f"
  sed -i '' "s|style={{ borderBottom: \"1px solid rgba(26,45,71,0.5)\" }}|style={{ borderBottom: \"1px solid var(--divider)\" }}|g" "$f"
  
  # Replace gradient backgrounds with simpler var-based approach
  sed -i '' 's|background: "linear-gradient(145deg, var(--surface-elevated) 0%, var(--surface) 100%)"|background: "var(--surface)"|g' "$f"
  sed -i '' 's|background: "linear-gradient(145deg, var(--surface-elevated), var(--surface))"|background: "var(--surface)"|g' "$f"
  
  echo "Fixed: $f"
done

echo "✅ All dashboard files updated with theme-aware colors"
