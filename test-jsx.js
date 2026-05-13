const fs = require('fs');
const content = fs.readFileSync('src/app/dashboard/pricing/pricing-client.tsx', 'utf8');

let stack = [];
let i = 0;
while (i < content.length) {
  // skip comments
  if (content.slice(i, i+2) === '/*') {
    i = content.indexOf('*/', i) + 2;
    continue;
  }
  // skip strings
  if (content[i] === '"' || content[i] === "'") {
    let q = content[i];
    i++;
    while (i < content.length && content[i] !== q) {
      if (content[i] === '\\') i++;
      i++;
    }
    i++;
    continue;
  }
  // skip template literals (naive)
  if (content[i] === '`') {
    i++;
    while (i < content.length && content[i] !== '`') {
      if (content[i] === '\\') i++;
      i++;
    }
    i++;
    continue;
  }
  
  if (content[i] === '<') {
    let nextSpace = content.slice(i).match(/[\s>]/)?.index;
    let tagEndIndex = content.indexOf('>', i);
    if (tagEndIndex > -1) {
      let tagInner = content.slice(i+1, tagEndIndex);
      let isClosing = tagInner.startsWith('/');
      let isSelfClosing = tagInner.endsWith('/');
      
      let tagName = tagInner.split(/[\s>/]/)[0];
      
      if (tagName && /^[A-Za-z]/.test(tagName) && tagName !== 'svg' && tagName !== 'path' && tagName !== 'circle') {
        if (!isSelfClosing && !isClosing) {
          stack.push(tagName);
          console.log(`Open: ${tagName} at char ${i}`);
        } else if (isClosing) {
          let expected = stack.pop();
          tagName = tagName.slice(1);
          if (expected !== tagName) {
             console.log(`Mismatch at char ${i}: Expected ${expected}, got ${tagName}`);
          } else {
             console.log(`Close: ${tagName}`);
          }
        }
      }
    }
  }
  i++;
}

console.log('Remaining in stack:', stack);
