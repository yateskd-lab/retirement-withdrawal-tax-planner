const fs = require('fs');

// Read the built file (find the JS file dynamically)
const assetsDir = './dist/assets/';
const files = fs.readdirSync(assetsDir);
const jsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
if (!jsFile) {
  console.error('Could not find built JS file');
  process.exit(1);
}
const filePath = assetsDir + jsFile;
console.log('Processing file:', jsFile);
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original file size:', content.length);

// Step 1: Find the API key variable name by looking for useState("")
const apiKeyMatch = content.match(/\[([A-Z]),([A-Z]+)\]=v\.useState\(""\)/);
if (!apiKeyMatch) {
  console.error('ERROR: Could not find API key state variable');
  process.exit(1);
}
const apiKeyVar = apiKeyMatch[1];
const apiKeySetterVar = apiKeyMatch[2];
console.log(`Found API key variable: ${apiKeyVar} (setter: ${apiKeySetterVar})`);

// Step 2: Find and fix saveData function
// Pattern: const X=async()=>{try{const j={...};await window.storage.set
const savePattern = /(const [A-Z]=async\(\)=>\{try\{const j=\{[^}]+\};)(?!j\.userApiKey)/;
const saveMatch = content.match(savePattern);
if (saveMatch) {
  console.log('Found saveData function');
  const replacement = saveMatch[1] + `j.userApiKey=${apiKeyVar};`;
  content = content.replace(savePattern, replacement);
  console.log('Injected userApiKey into saveData');
} else {
  console.log('Note: saveData pattern not found or already injected');
}

// Step 3: Find and fix exportData function
// Pattern: exportedAt:new Date().toISOString()}
// Only inject if userApiKey is not already there
if (!content.includes('exportedAt:new Date().toISOString(),userApiKey:')) {
  const exportPattern = /(exportedAt:new Date\(\)\.toISOString\(\))\}/;
  const exportMatch = content.match(exportPattern);
  if (exportMatch) {
    console.log('Found exportData function');
    const replacement = exportMatch[1] + `,userApiKey:${apiKeyVar}}`;
    content = content.replace(exportPattern, replacement);
    console.log('Injected userApiKey into exportData');
  } else {
    console.log('WARNING: Could not find exportData pattern');
  }
} else {
  console.log('Note: exportData already has userApiKey, checking if variable name is correct...');
  // Fix wrong variable name if present
  const wrongVarPattern = /exportedAt:new Date\(\)\.toISOString\(\),userApiKey:([A-Z])\}/;
  const wrongVarMatch = content.match(wrongVarPattern);
  if (wrongVarMatch && wrongVarMatch[1] !== apiKeyVar) {
    console.log(`Fixing variable name from ${wrongVarMatch[1]} to ${apiKeyVar}`);
    content = content.replace(wrongVarPattern, `exportedAt:new Date().toISOString(),userApiKey:${apiKeyVar}}`);
  }
}

// Step 4: Remove any broken leftover injections like };j.userApiKey=X,E=new Blob
const brokenPattern = /\};j\.userApiKey=[A-Z],E=/g;
if (content.match(brokenPattern)) {
  console.log('Removing broken injection');
  content = content.replace(brokenPattern, '};const E=');
}

// Step 5: Find and fix loadData function
// Pattern: X.metals&&f(X.metals) where X is the data variable
const loadPattern = /([A-Z])\.metals&&f\(\1\.metals\)/;
const loadMatch = content.match(loadPattern);
if (loadMatch) {
  const dataVar = loadMatch[1];
  // Check if userApiKey loading already exists
  if (!content.includes(`${dataVar}.userApiKey&&`)) {
    console.log(`Found loadData function (data variable: ${dataVar})`);
    const replacement = loadMatch[0] + `,${dataVar}.userApiKey&&${apiKeySetterVar}(${dataVar}.userApiKey)`;
    content = content.replace(loadPattern, replacement);
    console.log('Injected userApiKey loading into loadData');
  } else {
    console.log('Note: loadData already has userApiKey loading');
  }
} else {
  console.log('Note: loadData pattern not found or already injected');
}

// Write the modified content
fs.writeFileSync(filePath, content);
console.log('Modified file size:', content.length);
console.log('File updated successfully!');
