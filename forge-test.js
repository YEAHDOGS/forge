'use strict';
/* Forge test suite — fee math + form validation. Run: node forge-test.js */
const assert = require('node:assert');
const L = require('./logic.js');

let n = 0;
function t(name, fn) {
  n += 1;
  try {
    fn();
    console.log('ok ' + n + ' - ' + name);
  } catch (e) {
    console.error('FAIL ' + n + ' - ' + name + ': ' + e.message);
    process.exitCode = 1;
  }
}

/* --- Verified Oklahoma data integrity --- */
t('Oklahoma is live and verified', () => {
  assert.strictEqual(L.STATES.OK.live, true);
  assert.strictEqual(L.STATES.OK.verified, '2026-09-09');
  assert.strictEqual(L.STATES.OK.source, 'sos.ok.gov');
});
t('Oklahoma filing fee is $100', () => assert.strictEqual(L.STATES.OK.filing.fee, 100));
t('Oklahoma annual certificate is $25', () => assert.strictEqual(L.STATES.OK.annual.fee, 25));
t('Oklahoma name reservation is $10 / 60 days', () => {
  assert.strictEqual(L.STATES.OK.nameReservation.fee, 10);
  assert.strictEqual(L.STATES.OK.nameReservation.days, 60);
});
t('Oklahoma agent commercial band is $50-125', () => {
  assert.deepStrictEqual(L.STATES.OK.registeredAgent.commercialBand, [50, 125]);
});
t('Oklahoma: no publication, member names not on articles', () => {
  assert.strictEqual(L.STATES.OK.publicationRequired, false);
  assert.strictEqual(L.STATES.OK.memberNamesOnArticles, false);
});
t('Oklahoma EIN is free', () => assert.strictEqual(L.STATES.OK.ein.fee, 0));

/* --- Honesty: coming-soon states carry NO fee data --- */
t('TX/DE/WY are coming-soon with no fee data', () => {
  for (const code of L.COMING_SOON_STATES) {
    const s = L.STATES[code];
    assert.strictEqual(s.live, false, code);
    assert.strictEqual(s.comingSoon, true, code);
    assert.strictEqual(s.filing, undefined, code + ' must not have filing data');
    assert.strictEqual(s.annual, undefined, code + ' must not have annual data');
  }
});
t('live list contains only OK', () => assert.deepStrictEqual(L.LIVE_STATES, ['OK']));

/* --- Fee math --- */
t('base fees: $100 one-time, 2 line items', () => {
  const r = L.calcFees('OK', { reserveName: false, agent: 'self' });
  assert.strictEqual(r.oneTimeTotal, 100);
  assert.strictEqual(r.lines.length, 2);
  assert.strictEqual(r.currency, 'USD');
});
t('name reservation adds $10', () => {
  const r = L.calcFees('OK', { reserveName: true, agent: 'self' });
  assert.strictEqual(r.oneTimeTotal, 110);
});
t('commercial agent adds a yearly band, not a fixed fee', () => {
  const r = L.calcFees('OK', { reserveName: false, agent: 'commercial' });
  const agent = r.lines.find((l) => l.kind === 'yearly' && l.band);
  assert.ok(agent, 'band line present');
  assert.deepStrictEqual(agent.band, [50, 125]);
  assert.strictEqual(r.oneTimeTotal, 100, 'one-time total unchanged by yearly band');
});
t('reservation + commercial agent = $110 one-time + band', () => {
  const r = L.calcFees('OK', { reserveName: true, agent: 'commercial' });
  assert.strictEqual(r.oneTimeTotal, 110);
});
t('calcFees throws for coming-soon states', () => {
  assert.throws(() => L.calcFees('TX', {}), /Unsupported state/);
  assert.throws(() => L.calcFees('ZZ', {}), /Unsupported state/);
});
t('calcFees throws for bad agent option', () => {
  assert.throws(() => L.calcFees('OK', { agent: 'cousin' }), /Bad agent option/);
});

/* --- Validators --- */
t('validateEmail accepts good, rejects bad', () => {
  assert.strictEqual(L.validateEmail('boss@dogs.co').ok, true);
  assert.strictEqual(L.validateEmail('boss@dogs.co').value, 'boss@dogs.co');
  assert.strictEqual(L.validateEmail('not-an-email').ok, false);
  assert.strictEqual(L.validateEmail('').ok, false);
  assert.strictEqual(L.validateEmail('a@b').ok, false);
});
t('validateLLCName requires an LLC designator', () => {
  assert.strictEqual(L.validateLLCName('Dogs LLC', 'OK').ok, true);
  assert.strictEqual(L.validateLLCName('Dogs Limited Liability Company', 'OK').ok, true);
  assert.strictEqual(L.validateLLCName('dogs', 'OK').ok, false);
  assert.strictEqual(L.validateLLCName('', 'OK').ok, false);
  assert.strictEqual(L.validateLLCName('AB', 'OK').ok, false);
});
t('validateStreet rejects PO boxes and empties', () => {
  assert.strictEqual(L.validateStreet('123 Main St').ok, true);
  assert.strictEqual(L.validateStreet('PO Box 123').ok, false);
  assert.strictEqual(L.validateStreet('P.O. Box 9').ok, false);
  assert.strictEqual(L.validateStreet('').ok, false);
});

/* --- Post-filing checklist --- */
t('post-filing checklist has the 5 steps in order', () => {
  const ids = L.POST_FILING_STEPS.map((s) => s.id);
  assert.deepStrictEqual(ids, ['ein', 'oa', 'bank', 'card', 'domain']);
});

if (!process.exitCode) console.log('\nAll ' + n + ' tests passed.');
