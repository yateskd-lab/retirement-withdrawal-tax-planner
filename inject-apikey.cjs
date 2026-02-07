const fs = require('fs');

// Read the built file
const filePath = './dist/assets/index-df7b236f.js';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original file size:', content.length);

// Pattern 1: Find saveData function (H) and inject userApiKey after data object creation
// Looking for: const H=async()=>{try{const j={...};await window.storage.set
// Inject: j.userApiKey=C; before await window.storage.set

const savePattern = /(const H=async\(\)=>\{try\{const j=\{[^}]+\};)/;
const saveMatch = content.match(savePattern);
if (saveMatch) {
  console.log('Found saveData function');
  const replacement = saveMatch[1] + 'j.userApiKey=C;';
  content = content.replace(savePattern, replacement);
  console.log('Injected userApiKey into saveData');
} else {
  console.log('WARNING: Could not find saveData pattern');
}

// Pattern 2: Find exportData function and inject userApiKey after exportedAt
// Looking for: exportedAt:new Date().toISOString()}
// Inject: j.userApiKey=C; after the closing brace

const exportPattern = /(exportedAt:new Date\(\)\.toISOString\(\)\})/;
const exportMatch = content.match(exportPattern);
if (exportMatch) {
  console.log('Found exportData function');
  const replacement = exportMatch[1] + ';j.userApiKey=C';
  content = content.replace(exportPattern, replacement);
  console.log('Injected userApiKey into exportData');
} else {
  console.log('WARNING: Could not find exportData pattern');
}

// Pattern 3: Find loadData function and inject code to load userApiKey
// Looking for: E.metals&&f(E.metals)
// Inject: ,E.userApiKey&&B(E.userApiKey) after it

const loadPattern = /(E\.metals&&f\(E\.metals\))/;
const loadMatch = content.match(loadPattern);
if (loadMatch) {
  console.log('Found loadData metals loading');
  const replacement = loadMatch[1] + ',E.userApiKey&&B(E.userApiKey)';
  content = content.replace(loadPattern, replacement);
  console.log('Injected userApiKey loading into loadData');
} else {
  console.log('WARNING: Could not find loadData pattern');
}

// Write the modified content
fs.writeFileSync(filePath, content);
console.log('Modified file size:', content.length);
console.log('File updated successfully!');
