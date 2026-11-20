import assert from 'node:assert';

console.log('Testing Step 4: Reception Matching Rules & Walk-in Logic...');

// 1. Exact Call Next Matching Algorithm
function matchNextCustomer(barberId, waitingTokens, barberOccupied = false) {
  if (barberOccupied) return null;

  return waitingTokens.find(token => 
    token.preferred_barber_id === barberId || token.preferred_barber_id === 'ANY'
  ) || null;
}

const waitingQueue = [
  { id: 'S-1', customer_name: 'Customer 1', preferred_barber_id: 'barber-2' /* Amit */ },
  { id: 'S-2', customer_name: 'Customer 2', preferred_barber_id: 'barber-3' /* Imran */ },
  { id: 'S-3', customer_name: 'Customer 3', preferred_barber_id: 'ANY' },
  { id: 'S-4', customer_name: 'Customer 4', preferred_barber_id: 'barber-1' /* Ravi */ },
];

// Test 1: Ravi calls next (barber-1)
// Should skip S-1 (Amit) and S-2 (Imran) and match S-3 ('ANY')
const raviMatch = matchNextCustomer('barber-1', waitingQueue);
assert.ok(raviMatch, 'Ravi should match an eligible token');
assert.strictEqual(raviMatch.id, 'S-3', 'Ravi must match S-3 (earliest ANY) and NOT S-1 or S-2');

// Test 2: If S-3 wasn't there, Ravi would match S-4 (Ravi)
const queueWithoutAny = [
  { id: 'S-1', customer_name: 'Customer 1', preferred_barber_id: 'barber-2' /* Amit */ },
  { id: 'S-2', customer_name: 'Customer 2', preferred_barber_id: 'barber-3' /* Imran */ },
  { id: 'S-4', customer_name: 'Customer 4', preferred_barber_id: 'barber-1' /* Ravi */ },
];
const raviMatchDirect = matchNextCustomer('barber-1', queueWithoutAny);
assert.strictEqual(raviMatchDirect.id, 'S-4', 'Ravi must match S-4 directly');

// Test 3: Strict Isolation - Amit only queue
const amitOnlyQueue = [
  { id: 'S-1', customer_name: 'Customer 1', preferred_barber_id: 'barber-2' /* Amit */ },
];
const raviMatchAmitOnly = matchNextCustomer('barber-1', amitOnlyQueue);
assert.strictEqual(raviMatchAmitOnly, null, 'Strict Isolation: Ravi must NEVER match a customer who selected Amit');

// Test 4: Occupied Barber cannot call next
const occupiedMatch = matchNextCustomer('barber-1', waitingQueue, true);
assert.strictEqual(occupiedMatch, null, 'Occupied barber serving a customer in chair cannot call next');

// Test 5: Walk-in allowed after online cutoff
function canJoinQueue(isWalkIn, isOnlineOpen) {
  if (isWalkIn) return true;
  return isOnlineOpen;
}

assert.strictEqual(canJoinQueue(false, false), false, 'Online join blocked when cutoff reached');
assert.strictEqual(canJoinQueue(true, false), true, 'Reception Walk-in allowed even when cutoff reached');

// Test 6: Over 60 minutes wait detection
function isLongWait(createdAt, now) {
  const diffMins = (now - new Date(createdAt).getTime()) / 60000;
  return diffMins > 60;
}

const nowTime = Date.now();
const recentTokenTime = new Date(nowTime - 25 * 60000).toISOString();
const delayedTokenTime = new Date(nowTime - 65 * 60000).toISOString();

assert.strictEqual(isLongWait(recentTokenTime, nowTime), false, '25 min wait is normal');
assert.strictEqual(isLongWait(delayedTokenTime, nowTime), true, '65 min wait triggers amber alert');

console.log('✓ All Step 4 Reception Dashboard tests passed successfully!');
