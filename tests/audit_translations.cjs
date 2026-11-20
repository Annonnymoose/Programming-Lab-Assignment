const fs = require('fs');
const path = require('path');

const fileContent = fs.readFileSync(path.join(__dirname, '../src/lib/translations.ts'), 'utf8');

// Extract EN and GU object blocks
const enBlockMatch = fileContent.match(/EN:\s*\{([\s\S]*?)\},\s*GU:\s*\{/);
const guBlockMatch = fileContent.match(/GU:\s*\{([\s\S]*?)\}\s*\}\s*;/);

if (!enBlockMatch || !guBlockMatch) {
  console.error('Failed to parse translation blocks');
  process.exit(1);
}

const extractKeys = (block) => {
  const keys = [];
  const lines = block.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*([a-zA-Z0-9_]+):/);
    if (match) {
      keys.push(match[1]);
    }
  }
  return keys;
};

const enKeys = extractKeys(enBlockMatch[1]);
const guKeys = extractKeys(guBlockMatch[1]);

console.log(`EN key count: ${enKeys.length}`);
console.log(`GU key count: ${guKeys.length}`);

const missingInGu = enKeys.filter(k => !guKeys.includes(k));
const missingInEn = guKeys.filter(k => !enKeys.includes(k));

if (missingInGu.length > 0) {
  console.error('Keys in EN missing in GU:', missingInGu);
  process.exit(1);
}

if (missingInEn.length > 0) {
  console.error('Keys in GU missing in EN:', missingInEn);
  process.exit(1);
}

console.log('✓ Zero translation leaks! Every single EN key exists in GU dictionary.');
