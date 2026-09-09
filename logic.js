'use strict';
/* Forge — pure logic (no DOM).
   Shared between the browser wizard and the node test suite.
   Fee/rule data is VERIFIED against sos.ok.gov on 2026-09-09.
   Never add fee data for a state that hasn't been verified — mark it comingSoon. */

const STATES = {
  OK: {
    code: 'OK',
    name: 'Oklahoma',
    live: true,
    verified: '2026-09-09',
    source: 'sos.ok.gov',
    filing: {
      formName: 'Articles of Organization',
      formId: 'SOS Form 0074',
      fee: 100,
      where: 'sos.ok.gov',
      onlineTurnaround: '~1 business day',
      mailTurnaround: '7–10 business days',
      expediteFee: 25,
      expediteNote: '+$25 for in-person same-day service',
    },
    annual: {
      name: 'Annual Certificate',
      fee: 25,
      due: 'every year on the anniversary of formation',
      fileEarly: 'may file up to 60 days early',
      late60: 'lose good standing',
      late3yr: 'dissolved / revoked',
      noticeGoesTo: 'email on file — and nowhere else',
    },
    nameReservation: { fee: 10, days: 60, optional: true },
    nameRules: {
      mustContain: ['LLC', 'L.L.C.', 'Limited Liability Company', 'Limited Company', 'LC', 'L.C.', 'Ltd.', 'Co.'],
      mustBeDistinguishable: true,
      checkWhere: 'sos.ok.gov',
    },
    registeredAgent: {
      requirement: 'Must be an Oklahoma resident or qualified entity with an Oklahoma street address (no PO boxes), available during normal business hours.',
      commercialBand: [50, 125], // $/yr, typical commercial service price band
      selfPossible: 'Only if you have an Oklahoma street address and are reachable in business hours.',
    },
    principalAddress: {
      rule: 'Street address of the principal place of business, wherever located. PO boxes are NOT acceptable.',
    },
    memberNamesOnArticles: false,
    termDefault: 'perpetual',
    publicationRequired: false,
    franchiseTax: 'none for most LLCs',
    ein: { fee: 0, where: 'IRS (irs.gov)', note: 'free, online, immediate' },
    texasWarning: {
      applies: true,
      fee: 750,
      cardFeePct: 2.7,
      note: 'Texas charges $750 (+2.7% card fee) to register an out-of-state LLC that transacts business in Texas, plus late fees after 90 days. A Texas domestic LLC is about $300.',
      advice: 'Talk to a Texas business attorney before choosing Oklahoma if you will operate in Texas.',
    },
  },
  TX: { code: 'TX', name: 'Texas', live: false, comingSoon: true },
  DE: { code: 'DE', name: 'Delaware', live: false, comingSoon: true },
  WY: { code: 'WY', name: 'Wyoming', live: false, comingSoon: true },
};

const LIVE_STATES = Object.values(STATES).filter((s) => s.live).map((s) => s.code);
const COMING_SOON_STATES = Object.values(STATES).filter((s) => s.comingSoon).map((s) => s.code);

/* Fee math. opts: { reserveName: bool, agent: 'self' | 'commercial' }.
   Returns line items; commercial agent is a band, not a fixed fee. */
function calcFees(stateCode, opts) {
  const st = STATES[stateCode];
  if (!st || !st.live) throw new Error('Unsupported state: ' + stateCode);
  const o = Object.assign({ reserveName: false, agent: 'self' }, opts || {});
  if (o.agent !== 'self' && o.agent !== 'commercial') throw new Error('Bad agent option: ' + o.agent);

  const lines = [
    {
      label: st.filing.formName + ' (' + st.filing.formId + ')',
      amount: st.filing.fee,
      kind: 'one-time',
      note: 'file at ' + st.filing.where,
    },
  ];
  if (o.reserveName) {
    lines.push({
      label: 'Name reservation (' + st.nameReservation.days + ' days, optional)',
      amount: st.nameReservation.fee,
      kind: 'one-time',
    });
  }
  if (o.agent === 'commercial') {
    lines.push({
      label: 'Commercial registered agent (typical first-year band)',
      band: st.registeredAgent.commercialBand.slice(),
      kind: 'yearly',
      note: 'recurring yearly — shop providers',
    });
  } else {
    lines.push({
      label: 'Registered agent — yourself (Oklahoma street address)',
      amount: 0,
      kind: 'yearly',
    });
  }
  const oneTimeTotal = lines
    .filter((l) => l.kind === 'one-time')
    .reduce((sum, l) => sum + (l.amount || 0), 0);
  return { stateCode, lines, oneTimeTotal, currency: 'USD' };
}

function validateEmail(v) {
  const s = String(v || '').trim();
  if (!s) return { ok: false, error: 'Email is required.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return { ok: false, error: 'That does not look like a valid email address.' };
  return { ok: true, value: s };
}

const LLC_SUFFIX_RE = /\b(l\.?l\.?c\.?|limited liability compan(y|ies)|limited compan(y|ies)|l\.?c\.?|ltd\.?|co\.?)\b/i;

/* Oklahoma name rules: must contain an LLC designator and be a real name. */
function validateLLCName(v, stateCode) {
  const s = String(v || '').trim().replace(/\s+/g, ' ');
  if (s.length < 4) return { ok: false, error: 'Give your LLC a real name (at least a few characters).' };
  if (s.length > 120) return { ok: false, error: 'Keep it under 120 characters.' };
  const st = STATES[stateCode];
  if (st && st.live && !LLC_SUFFIX_RE.test(s)) {
    return {
      ok: false,
      error: 'The name must contain an LLC designator: ' + st.nameRules.mustContain.slice(0, 4).join(', ') + ', …',
    };
  }
  return { ok: true, value: s };
}

const PO_BOX_RE = /\bp\.?\s*o\.?\s*box\b/i;

function validateStreet(v) {
  const s = String(v || '').trim().replace(/\s+/g, ' ');
  if (!s) return { ok: false, error: 'Street address is required.' };
  if (PO_BOX_RE.test(s)) return { ok: false, error: 'PO boxes are not acceptable — a street address is required.' };
  if (s.length < 5) return { ok: false, error: 'That looks too short to be a street address.' };
  return { ok: true, value: s };
}

const POST_FILING_STEPS = [
  { id: 'ein', title: 'Get your EIN', detail: 'Free from the IRS at irs.gov — online, immediate. Banks require it.' },
  { id: 'oa', title: 'Write an operating agreement', detail: 'Not filed with the state — keep it on record. It protects your liability shield.' },
  { id: 'bank', title: 'Open a business bank account', detail: 'Bring your filed Articles and your EIN.' },
  { id: 'card', title: 'Apply for a business credit card', detail: 'Builds business credit; keeps business spending separate.' },
  { id: 'domain', title: 'Buy your domain on the business card', detail: 'Register it to the LLC — not in your personal name — for clean ownership.' },
];

const ForgeLogic = {
  STATES,
  LIVE_STATES,
  COMING_SOON_STATES,
  POST_FILING_STEPS,
  calcFees,
  validateEmail,
  validateLLCName,
  validateStreet,
};

if (typeof module !== 'undefined' && module.exports) module.exports = ForgeLogic;
if (typeof window !== 'undefined') window.ForgeLogic = ForgeLogic;
