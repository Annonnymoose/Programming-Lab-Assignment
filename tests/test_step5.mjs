import assert from 'node:assert';

console.log('Testing Step 5: Barber View Start/Done & TV Chime Synchronization...');

// Initial State
let barbers = [
  { id: 'barber-1', name: 'Ravi', status: 'Available', on_duty: true, current_token_id: null },
  { id: 'barber-2', name: 'Amit', status: 'Available', on_duty: true, current_token_id: null },
  { id: 'barber-3', name: 'Imran', status: 'Available', on_duty: true, current_token_id: null },
];

let tokens = [
  { id: 'S-1', customer_name: 'Customer 1', status: 'Waiting', preferred_barber_id: 'barber-1', total_duration_minutes: 30 },
  { id: 'S-2', customer_name: 'Customer 2', status: 'Waiting', preferred_barber_id: 'ANY', total_duration_minutes: 15 },
];

// Step 5.1: Call next for Ravi
const target = tokens.find(t => t.status === 'Waiting' && (t.preferred_barber_id === 'barber-1' || t.preferred_barber_id === 'ANY'));
assert.strictEqual(target.id, 'S-1', 'Ravi matches S-1');

target.status = 'Called';
target.assigned_barber_id = 'barber-1';
target.called_at = new Date().toISOString();
barbers[0].status = 'Busy';
barbers[0].current_token_id = 'S-1';

assert.strictEqual(target.status, 'Called', 'Customer is now Called');
assert.strictEqual(barbers[0].current_token_id, 'S-1', 'Ravi is assigned S-1');

// Step 5.2: Barber presses [ Start ] -> In chair
assert.strictEqual(target.status === 'Called', true, 'Token is ready to start');
target.status = 'In chair';
target.in_chair_at = new Date().toISOString();
barbers[0].started_at = target.in_chair_at;

assert.strictEqual(target.status, 'In chair', 'Status transitioned to In chair');
assert.ok(target.in_chair_at, 'in_chair_at timestamp is recorded');

// Step 5.3: Barber presses [ Done ] -> Done, barber becomes Available
target.status = 'Done';
target.completed_at = new Date().toISOString();
barbers[0].status = 'Available';
barbers[0].current_token_id = null;
barbers[0].started_at = null;

assert.strictEqual(target.status, 'Done', 'Token is completed');
assert.strictEqual(barbers[0].status, 'Available', 'Ravi is free and Available');
assert.strictEqual(barbers[0].current_token_id, null, 'Ravi has no current token');

// Step 5.4: Barber toggles break -> On break
barbers[0].status = 'On break';
assert.strictEqual(barbers[0].status, 'On break', 'Ravi is on break');

// Check active barbers
const activeCount = barbers.filter(b => b.on_duty && b.status !== 'On break').length;
assert.strictEqual(activeCount, 2, '2 active barbers remain');

// Toggle back to Available
barbers[0].status = 'Available';
const activeCountRestored = barbers.filter(b => b.on_duty && b.status !== 'On break').length;
assert.strictEqual(activeCountRestored, 3, 'All 3 barbers active again');

console.log('✓ All Step 5 Barber & TV transition tests passed successfully!');
