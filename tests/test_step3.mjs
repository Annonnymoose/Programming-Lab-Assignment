import assert from 'node:assert';

console.log('Testing Step 3: Sequential Tokens & My Status Logic...');

// 1. Sequential Token Generation Logic
function getNextTokenId(existingTokens, savedCounter) {
  let maxIdNum = 0;
  existingTokens.forEach(t => {
    const match = t.id.match(/^S-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxIdNum) maxIdNum = num;
    }
  });

  if (savedCounter) {
    const num = parseInt(savedCounter, 10);
    if (num > maxIdNum) maxIdNum = num;
  }

  const nextCounter = maxIdNum + 1;
  return `S-${nextCounter}`;
}

assert.strictEqual(getNextTokenId([], null), 'S-1', 'First token must be S-1');
assert.strictEqual(getNextTokenId([{ id: 'S-1' }], '1'), 'S-2', 'Second token must be S-2');
assert.strictEqual(getNextTokenId([{ id: 'S-1' }, { id: 'S-2' }], '2'), 'S-3', 'Third token must be S-3');
assert.strictEqual(getNextTokenId([{ id: 'S-1' }, { id: 'S-9' }], null), 'S-10', 'Handles gaps cleanly');

// 2. Position & 'Start Coming' condition
function shouldShowStartComing(status, position) {
  return status === 'Waiting' && position === 2;
}

assert.strictEqual(shouldShowStartComing('Waiting', 1), false, '1st in line does not show start coming');
assert.strictEqual(shouldShowStartComing('Waiting', 2), true, '2nd in line triggers start coming banner');
assert.strictEqual(shouldShowStartComing('Waiting', 3), false, '3rd in line does not show start coming');
assert.strictEqual(shouldShowStartComing('Called', 2), false, 'Called status does not show start coming (shows Called modal)');

// 3. Status Lifecycle for Cancellation
const ALLOWED_TRANSITIONS = {
  'Waiting': ['Called', 'Cancelled'],
  'Called': ['In chair', 'No-show'],
  'In chair': ['Done'],
  'Done': [],
  'Cancelled': [],
  'No-show': [],
};

function canCancel(status) {
  return ALLOWED_TRANSITIONS[status]?.includes('Cancelled') ?? false;
}

assert.strictEqual(canCancel('Waiting'), true, 'Waiting token can be cancelled');
assert.strictEqual(canCancel('Called'), false, 'Called token cannot be cancelled (handled via No-show)');
assert.strictEqual(canCancel('In chair'), false, 'In chair token cannot be cancelled');
assert.strictEqual(canCancel('Done'), false, 'Done token cannot be cancelled');

console.log('✓ All Step 3 test assertions passed successfully!');
