const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src/app/dashboard');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else if (file.endsWith('.tsx')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walkDir(baseDir);
let totalChanges = 0;

const replacements = [
  // Borders
  [/border: "1px solid rgba\(255,255,255,0\.0[345678]\)"/g, 'border: "1px solid var(--divider)"'],
  [/border: `1px solid rgba\(255,255,255,0\.04\)`/g, 'border: `1px solid var(--divider)`'],
  [/borderBottom: "1px dashed rgba\(255,255,255,0\.05\)"/g, 'borderBottom: "1px dashed var(--divider)"'],
  [/borderBottom: "1px solid rgba\(26,45,71,0\.5\)"/g, 'borderBottom: "1px solid var(--divider)"'],
  
  // Box shadows - normalize to CSS vars
  [/boxShadow: "0 2px 12px rgba\(0,0,0,0\.3\), inset 0 1px 0 rgba\(255,255,255,0\.03\)"/g, 'boxShadow: "var(--shadow-md)"'],
  [/boxShadow: "0 2px 12px rgba\(0,0,0,0\.3\)"/g, 'boxShadow: "var(--shadow-md)"'],
  [/boxShadow: "0 4px 20px rgba\(0,0,0,0\.2\)"/g, 'boxShadow: "var(--shadow-lg)"'],
  [/boxShadow: "0 2px 8px rgba\(0,0,0,0\.25\)"/g, 'boxShadow: "var(--shadow-md)"'],
  [/boxShadow: "0 2px 10px rgba\(0,0,0,0\.25\), inset 0 1px 0 rgba\(255,255,255,0\.04\)"/g, 'boxShadow: "var(--shadow-md)"'],
  
  // Background gradients → simple var
  [/background: "linear-gradient\(145deg, var\(--surface-elevated\) 0%, var\(--surface\) 100%\)"/g, 'background: "var(--surface)"'],
  [/background: "linear-gradient\(145deg, var\(--surface-elevated\), var\(--surface\)\)"/g, 'background: "var(--surface)"'],
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  replacements.forEach(([pattern, replacement]) => {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      changed = true;
      const matches = content.match(pattern);
      totalChanges += matches ? matches.length : 0;
      content = newContent;
    }
  });
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed:', path.relative(__dirname, file));
  }
});

console.log(`\n✅ Total replacements: ${totalChanges} across ${files.length} files`);
