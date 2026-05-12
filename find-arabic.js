const fs = require('fs');
const path = require('path');

function findArabic(dir) {
  let files = fs.readdirSync(dir);
  for (let file of files) {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findArabic(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (/[\u0600-\u06FF]/.test(content)) {
        console.log(fullPath);
      }
    }
  }
}
findArabic('src/app');
findArabic('src/components');
