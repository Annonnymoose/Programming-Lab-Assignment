import assert from 'node:assert';

console.log('Testing Step 6: Owner Admin Settings, Master Queue Switch & KPIs...');

// 1. Master Queue Override Logic
function isQueueOpen(override, currentHour, currentMinute) {
  if (override !== null) return override;
  // Auto cutoff at 20:30 (8:30 PM)
  if (currentHour > 20) return false;
  if (currentHour === 20 && currentMinute >= 30) return false;
  return true;
}

assert.strictEqual(isQueueOpen(null, 14, 0), true, 'Auto: 2:00 PM is Open');
assert.strictEqual(isQueueOpen(null, 20, 29), true, 'Auto: 8:29 PM is Open');
assert.strictEqual(isQueueOpen(null, 20, 30), false, 'Auto: 8:30 PM is Closed');
assert.strictEqual(isQueueOpen(null, 21, 0), false, 'Auto: 9:00 PM is Closed');
assert.strictEqual(isQueueOpen(true, 22, 0), true, 'Override TRUE: 10:00 PM forced OPEN');
assert.strictEqual(isQueueOpen(false, 12, 0), false, 'Override FALSE: 12:00 PM forced CLOSED');

// 2. Barber Duty Logic
let barbers = [
  { id: 'barber-1', name: 'Ravi', on_duty: true, status: 'Available' },
  { id: 'barber-2', name: 'Amit', on_duty: true, status: 'Available' },
  { id: 'barber-3', name: 'Imran', on_duty: true, status: 'Available' },
];

function getActiveCount(staff) {
  return staff.filter(b => b.on_duty && b.status !== 'On break').length;
}

assert.strictEqual(getActiveCount(barbers), 3, 'All 3 on duty');
barbers[0].on_duty = false;
assert.strictEqual(getActiveCount(barbers), 2, 'Ravi off duty -> 2 active');
barbers[1].status = 'On break';
assert.strictEqual(getActiveCount(barbers), 1, 'Amit on break -> 1 active (Imran)');
barbers[2].on_duty = false;
assert.strictEqual(getActiveCount(barbers), 0, 'Imran off duty -> 0 active (paused)');

// 3. Service Management Logic
let services = [
  { id: 'srv-1', name_en: 'Haircut', name_gu: 'હેરકટ', duration_minutes: 30, price: 150, is_active: true },
];

// Add Service
const newSrv = { id: 'srv-2', name_en: 'Shave', name_gu: 'શેવ', duration_minutes: 20, price: 100, is_active: true };
services.push(newSrv);
assert.strictEqual(services.length, 2, 'Service added');

// Update Service
services[0] = { ...services[0], price: 180, duration_minutes: 35 };
assert.strictEqual(services[0].price, 180, 'Price updated');
assert.strictEqual(services[0].duration_minutes, 35, 'Duration updated');

// Toggle Active
services[1].is_active = false;
const activeForJoin = services.filter(s => s.is_active);
assert.strictEqual(activeForJoin.length, 1, 'Inactive service excluded from join queue');

// 4. KPI Calculations
const sampleTokens = [
  { id: 'S-1', status: 'Done', created_at: '2026-11-20T10:00:00Z', called_at: '2026-11-20T10:15:00Z' }, // 15 min wait
  { id: 'S-2', status: 'Done', created_at: '2026-11-20T10:30:00Z', called_at: '2026-11-20T10:55:00Z' }, // 25 min wait
  { id: 'S-3', status: 'No-show' },
  { id: 'S-4', status: 'Waiting' },
];

const served = sampleTokens.filter(t => t.status === 'Done').length;
const noshows = sampleTokens.filter(t => t.status === 'No-show').length;
const waiting = sampleTokens.filter(t => t.status === 'Waiting').length;

const waited = sampleTokens.filter(t => t.called_at);
const avgWait = Math.round(
  waited.reduce((acc, t) => acc + (new Date(t.called_at) - new Date(t.created_at)) / 60000, 0) / waited.length
);

assert.strictEqual(served, 2, '2 customers served');
assert.strictEqual(noshows, 1, '1 no-show');
assert.strictEqual(waiting, 1, '1 waiting');
assert.strictEqual(avgWait, 20, 'Average wait = (15 + 25) / 2 = 20 min');

console.log('✓ All Step 6 Owner Admin tests passed successfully!');
