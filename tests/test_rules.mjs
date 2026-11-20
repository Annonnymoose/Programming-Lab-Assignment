import assert from 'node:assert';

console.log('Testing Step 2 Rules & Validations...');

// 1. Phone number validation (Indian 10-digit mobile ^[6-9]\d{9}$)
const phoneRegex = /^[6-9]\d{9}$/;
assert.strictEqual(phoneRegex.test('9876543210'), true, 'Valid 10-digit phone starting with 9');
assert.strictEqual(phoneRegex.test('8876543210'), true, 'Valid 10-digit phone starting with 8');
assert.strictEqual(phoneRegex.test('7876543210'), true, 'Valid 10-digit phone starting with 7');
assert.strictEqual(phoneRegex.test('6876543210'), true, 'Valid 10-digit phone starting with 6');
assert.strictEqual(phoneRegex.test('5876543210'), false, 'Invalid: starts with 5');
assert.strictEqual(phoneRegex.test('987654321'), false, 'Invalid: 9 digits');
assert.strictEqual(phoneRegex.test('98765432101'), false, 'Invalid: 11 digits');
assert.strictEqual(phoneRegex.test('98765abcde'), false, 'Invalid: non-digits');

// 2. Service selection limits (Min 1, Max 3)
function validateServices(selected) {
  return selected.length >= 1 && selected.length <= 3;
}
assert.strictEqual(validateServices([]), false, '0 services must fail');
assert.strictEqual(validateServices(['srv-1']), true, '1 service must pass');
assert.strictEqual(validateServices(['srv-1', 'srv-2']), true, '2 services must pass');
assert.strictEqual(validateServices(['srv-1', 'srv-2', 'srv-3']), true, '3 services must pass');
assert.strictEqual(validateServices(['srv-1', 'srv-2', 'srv-3', 'srv-4']), false, '4 services must fail');

// 3. Duplicate phone logic
const activeTokens = [
  { id: 'S-1', phone: '9876543210', status: 'Waiting' },
  { id: 'S-2', phone: '8876543210', status: 'Called' },
  { id: 'S-3', phone: '7876543210', status: 'In chair' },
  { id: 'S-4', phone: '6876543210', status: 'Done' },
];

function hasActiveToken(phone) {
  return activeTokens.find(t => 
    ['Waiting', 'Called', 'In chair'].includes(t.status) && t.phone === phone
  );
}

assert.ok(hasActiveToken('9876543210'), 'Waiting token is active');
assert.ok(hasActiveToken('8876543210'), 'Called token is active');
assert.ok(hasActiveToken('7876543210'), 'In chair token is active');
assert.strictEqual(hasActiveToken('6876543210'), undefined, 'Done token is NOT active; customer can join again');
assert.strictEqual(hasActiveToken('9999999999'), undefined, 'Unknown phone has no active token');

console.log('✓ All Step 2 Rule validations passed successfully!');
