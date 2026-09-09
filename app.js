'use strict';
/* Forge wizard — DOM layer. Pure logic lives in logic.js (ForgeLogic). */
(function () {
  var L = window.ForgeLogic || (typeof require !== 'undefined' && require('./logic.js'));
  var DRAFT_KEY = 'forge.draft.v1';
  var CHECK_KEY = 'forge.checklist.v1';

  var STEPS = ['state', 'texas', 'name', 'agent', 'address', 'email', 'structure', 'worksheet'];
  var STEP_TITLES = {
    state: 'Pick your state',
    texas: 'Texas check',
    name: 'Name your LLC',
    agent: 'Registered agent',
    address: 'Principal address',
    email: 'Contact email',
    structure: 'Structure',
    worksheet: 'Your filing worksheet',
  };

  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  var draft = load(DRAFT_KEY, {
    state: 'OK', texasOps: null, name: '', reserveName: false,
    agent: null, street: '', city: '', st: '', zip: '',
    email: '', structure: 'member-managed',
  });
  var checks = load(CHECK_KEY, {});
  var stepIdx = 0;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) { return '$' + n; }

  function feeSummary() {
    try {
      return L.calcFees(draft.state, { reserveName: draft.reserveName, agent: draft.agent || 'self' });
    } catch (e) { return null; }
  }

  /* ---------- step renderers ---------- */

  function renderState() {
    var ok = L.STATES.OK;
    var cards = '';
    cards += '<button type="button" class="state-card live" data-state="OK">'
      + '<span class="state-name">Oklahoma</span>'
      + '<span class="state-badge">LIVE</span>'
      + '<span class="state-sub">Articles ' + money(ok.filing.fee) + ' · verified ' + esc(ok.verified) + '</span>'
      + '</button>';
    L.COMING_SOON_STATES.forEach(function (code) {
      var s = L.STATES[code];
      cards += '<button type="button" class="state-card soon" disabled>'
        + '<span class="state-name">' + esc(s.name) + '</span>'
        + '<span class="state-badge">COMING SOON</span>'
        + '<span class="state-sub">Fee data not yet verified — never faked</span>'
        + '</button>';
    });
    return '<p class="lede">Forge starts with one state, done right. More states drop in as their fee data gets verified — never before.</p>'
      + '<div class="state-grid">' + cards + '</div>';
  }

  function renderTexas() {
    var warn = '';
    if (draft.texasOps === 'yes') {
      var tw = L.STATES.OK.texasWarning;
      warn = '<div class="warn"><strong>Heads up — Texas is expensive for out-of-state LLCs.</strong>'
        + '<p>Texas charges <strong>' + money(tw.fee) + '</strong> (+' + tw.cardFeePct + '% card fee) to register a foreign LLC that transacts business in Texas, plus late fees after 90 days. '
        + tw.advice + '</p></div>';
    }
    return '<p class="lede">An Oklahoma LLC that operates in Texas usually has to register there too — and Texas charges for it.</p>'
      + '<div class="radio-group" role="radiogroup" aria-label="Texas operations">'
      + radio('texasOps', 'yes', 'Yes — I\'ll operate in Texas', draft.texasOps)
      + radio('texasOps', 'no', 'No Texas operations planned', draft.texasOps)
      + '</div>' + warn;
  }

  function radio(name, value, label, current) {
    var checked = current === value ? ' checked' : '';
    return '<label class="radio"><input type="radio" name="' + name + '" value="' + value + '"' + checked + '>'
      + '<span>' + label + '</span></label>';
  }

  function renderName() {
    var v = L.validateLLCName(draft.name, 'OK');
    var err = draft.name ? (v.ok ? '' : '<p class="err">' + esc(v.error) + '</p>') : '';
    var res = draft.reserveName
      ? '<p class="note">+ ' + money(L.STATES.OK.nameReservation.fee) + ' to hold the name ' + L.STATES.OK.nameReservation.days + ' days while you get ready.</p>' : '';
    return '<p class="lede">Must contain an LLC designator and be distinguishable from existing Oklahoma names.</p>'
      + '<label class="field"><span>LLC legal name</span>'
      + '<input id="f-name" type="text" inputmode="text" autocomplete="organization" placeholder="Dogs LLC" value="' + esc(draft.name) + '"></label>'
      + err
      + '<p class="note">Check availability at the Oklahoma Secretary of State: '
      + '<a href="https://www.sos.ok.gov/" target="_blank" rel="noopener">sos.ok.gov</a> → business name search.</p>'
      + '<label class="check"><input id="f-reserve" type="checkbox"' + (draft.reserveName ? ' checked' : '') + '>'
      + '<span>Reserve this name for ' + L.STATES.OK.nameReservation.days + ' days (' + money(L.STATES.OK.nameReservation.fee) + ', optional)</span></label>'
      + res;
  }

  function renderAgent() {
    var ra = L.STATES.OK.registeredAgent;
    return '<p class="lede">Every Oklahoma LLC must have a registered agent with an Oklahoma street address, reachable in business hours.</p>'
      + '<div class="radio-group" role="radiogroup" aria-label="Registered agent">'
      + radio('agent', 'self', 'I\'ll be my own agent — I have an Oklahoma street address', draft.agent)
      + radio('agent', 'commercial', 'Hire a commercial service (~' + money(ra.commercialBand[0]) + '–' + money(ra.commercialBand[1]) + '/yr)', draft.agent)
      + '</div>'
      + '<p class="note">' + esc(ra.requirement) + '</p>'
      + '<p class="note">Nomadic with no Oklahoma address? You can\'t be your own agent — a commercial service is the move.</p>'
      + feeBox();
  }

  function renderAddress() {
    var sv = L.validateStreet(draft.street);
    var err = draft.street ? (sv.ok ? '' : '<p class="err">' + esc(sv.error) + '</p>') : '';
    return '<p class="lede">Street address of the principal place of business — wherever located. <strong>PO boxes are not acceptable.</strong></p>'
      + '<label class="field"><span>Street address</span>'
      + '<input id="f-street" type="text" autocomplete="street-address" placeholder="123 Main St" value="' + esc(draft.street) + '"></label>'
      + err
      + '<div class="row2">'
      + '<label class="field"><span>City</span><input id="f-city" type="text" autocomplete="address-level2" value="' + esc(draft.city) + '"></label>'
      + '<label class="field"><span>State</span><input id="f-st" type="text" autocomplete="address-level1" value="' + esc(draft.st) + '"></label>'
      + '</div>'
      + '<label class="field"><span>ZIP</span><input id="f-zip" type="text" inputmode="numeric" autocomplete="postal-code" value="' + esc(draft.zip) + '"></label>'
      + '<p class="note">Remote or nomadic? Use a stable street address — a family address or a mailbox service that gives you a real street address.</p>';
  }

  function renderEmail() {
    var v = L.validateEmail(draft.email);
    var err = draft.email ? (v.ok ? '' : '<p class="err">' + esc(v.error) + '</p>') : '';
    return '<p class="lede"><strong>This is the most important field on the form.</strong> Oklahoma sends Annual Certificate notices to this email <strong>and nowhere else</strong>. Miss it and you can lose good standing without ever knowing.</p>'
      + '<label class="field"><span>Primary contact email</span>'
      + '<input id="f-email" type="email" inputmode="email" autocomplete="email" placeholder="you@business.com" value="' + esc(draft.email) + '"></label>'
      + err
      + '<p class="note">Use an address you will keep for years — the $25 Annual Certificate is due every year on your formation anniversary.</p>';
  }

  function renderStructure() {
    return '<p class="lede">How the LLC is run. Single member? Member-managed is the standard pick.</p>'
      + '<div class="radio-group" role="radiogroup" aria-label="Management structure">'
      + radio('structure', 'member-managed', 'Member-managed (standard for single-member)', draft.structure)
      + radio('structure', 'manager-managed', 'Manager-managed (designated managers run it)', draft.structure)
      + '</div>'
      + '<p class="note">Term of existence: <strong>perpetual</strong>. Member/manager names are <strong>not</strong> required on Oklahoma articles.</p>'
      + '<p class="note">Put the full ownership and decision rules in your operating agreement after filing.</p>';
  }

  function feeBox() {
    var f = feeSummary();
    if (!f) return '';
    var agentLine = f.lines.filter(function (l) { return l.kind === 'yearly'; })[0];
    var agentTxt = agentLine.band
      ? money(agentLine.band[0]) + '–' + money(agentLine.band[1]) + '/yr (typical band)'
      : money(agentLine.amount) + '/yr';
    return '<div class="feebox"><div class="fee-row"><span>State filing fees (one-time)</span><strong>' + money(f.oneTimeTotal) + '</strong></div>'
      + '<div class="fee-row"><span>Registered agent</span><strong>' + agentTxt + '</strong></div>'
      + '<div class="fee-row dim"><span>Annual Certificate, every year</span><span>' + money(L.STATES.OK.annual.fee) + '/yr</span></div></div>';
  }

  function renderWorksheet() {
    var ok = L.STATES.OK;
    var f = feeSummary();
    var rows = [
      ['State', 'Oklahoma'],
      ['LLC name', draft.name + (draft.reserveName ? ' (name reserved, ' + money(ok.nameReservation.fee) + ')' : '')],
      ['Registered agent', draft.agent === 'commercial' ? 'Commercial service (~' + money(ok.registeredAgent.commercialBand[0]) + '–' + money(ok.registeredAgent.commercialBand[1]) + '/yr)' : 'Self (Oklahoma street address)'],
      ['Principal address', draft.street + ', ' + draft.city + ', ' + draft.st + ' ' + draft.zip],
      ['Contact email', draft.email],
      ['Management', draft.structure === 'member-managed' ? 'Member-managed' : 'Manager-managed'],
      ['Term', 'Perpetual'],
      ['Operate in Texas', draft.texasOps === 'yes' ? 'Yes — see warning below' : 'No'],
    ];
    var table = rows.map(function (r) {
      return '<div class="ws-row"><span>' + r[0] + '</span><strong>' + esc(r[1]) + '</strong></div>';
    }).join('');

    var txWarn = '';
    if (draft.texasOps === 'yes') {
      txWarn = '<div class="warn"><strong>Texas warning.</strong> ' + esc(ok.texasWarning.note) + ' ' + esc(ok.texasWarning.advice) + '</div>';
    }

    var steps = L.POST_FILING_STEPS.map(function (s) {
      var done = checks[s.id] ? ' checked' : '';
      return '<label class="check step"><input type="checkbox" data-step="' + s.id + '"' + done + '>'
        + '<span><strong>' + esc(s.title) + '</strong><br><small>' + esc(s.detail) + '</small></span></label>';
    }).join('');

    return '<div class="filing-note"><strong>Forge files nothing.</strong> This is a worksheet — you file the real Articles at sos.ok.gov yourself.</div>'
      + '<h3>Articles of Organization — worksheet</h3>'
      + '<div class="ws-table">' + table + '</div>'
      + '<h3>What you\'ll pay</h3>' + feeBox()
      + '<h3>How to file</h3>'
      + '<ol class="howto">'
      + '<li>Go to <a href="https://www.sos.ok.gov/" target="_blank" rel="noopener">sos.ok.gov</a>.</li>'
      + '<li>File the <strong>' + esc(ok.filing.formName) + '</strong> (' + esc(ok.filing.formId) + ') online — turnaround ' + esc(ok.filing.onlineTurnaround) + '. (Mail works too: ' + esc(ok.filing.mailTurnaround) + '.)</li>'
      + '<li>Pay <strong>' + money(ok.filing.fee) + '</strong>' + (draft.reserveName ? ' + ' + money(ok.nameReservation.fee) + ' name reservation' : '') + '. ' + esc(ok.filing.expediteNote) + '.</li>'
      + '<li>Have your registered agent lined up before you file — their name and Oklahoma street address go on the form.</li>'
      + '</ol>'
      + txWarn
      + '<h3>After the state stamps it</h3>'
      + '<div class="checklist">' + steps + '</div>'
      + '<div class="btn-row no-print"><button id="btn-print" class="btn gold" type="button">Print worksheet</button>'
      + '<button id="btn-restart" class="btn ghost" type="button">Start over</button></div>'
      + '<div class="disclaimer"><strong>Not legal advice.</strong> Forge is not a law firm. Fees verified ' + esc(ok.verified)
      + ' at sos.ok.gov — verify before you pay. This worksheet is a planning aid, not a filing.</div>';
  }

  var RENDER = {
    state: renderState, texas: renderTexas, name: renderName, agent: renderAgent,
    address: renderAddress, email: renderEmail, structure: renderStructure, worksheet: renderWorksheet,
  };

  /* ---------- validation gates ---------- */
  function validateStep(key) {
    switch (key) {
      case 'state': return draft.state === 'OK' ? null : 'Pick a live state.';
      case 'texas': return draft.texasOps ? null : 'Answer the Texas question to continue.';
      case 'name': {
        var v = L.validateLLCName(draft.name, 'OK');
        return v.ok ? null : v.error;
      }
      case 'agent': return draft.agent ? null : 'Choose how you\'ll handle the registered agent.';
      case 'address': {
        var s = L.validateStreet(draft.street);
        if (!s.ok) return s.error;
        if (!draft.city.trim() || !draft.st.trim() || !draft.zip.trim()) return 'City, state, and ZIP are required.';
        return null;
      }
      case 'email': {
        var e = L.validateEmail(draft.email);
        return e.ok ? null : e.error;
      }
      case 'structure': return draft.structure ? null : 'Pick a management structure.';
      case 'worksheet': return null;
    }
    return null;
  }

  /* ---------- shell ---------- */
  var app = document.getElementById('app');

  function render() {
    var key = STEPS[stepIdx];
    var dots = STEPS.map(function (s, i) {
      return '<span class="dot' + (i === stepIdx ? ' on' : '') + (i < stepIdx ? ' done' : '') + '"></span>';
    }).join('');
    var isLast = key === 'worksheet';

    app.innerHTML =
      '<div class="progress no-print"><span>Step ' + (stepIdx + 1) + ' of ' + STEPS.length + '</span><div class="dots">' + dots + '</div></div>'
      + '<h2>' + STEP_TITLES[key] + '</h2>'
      + '<div id="gate-err"></div>'
      + RENDER[key]()
      + '<div class="nav no-print">'
      + (stepIdx > 0 ? '<button id="btn-back" class="btn ghost" type="button">Back</button>' : '<span></span>')
      + (isLast ? '' : '<button id="btn-next" class="btn gold" type="button">Continue</button>')
      + '</div>';

    bind(key);
    window.scrollTo(0, 0);
  }

  function flashError(msg) {
    var el = document.getElementById('gate-err');
    if (el) el.innerHTML = '<p class="err">' + esc(msg) + '</p>';
  }

  function bind(key) {
    var back = document.getElementById('btn-back');
    var next = document.getElementById('btn-next');
    if (back) back.addEventListener('click', function () { stepIdx = Math.max(0, stepIdx - 1); render(); });
    if (next) next.addEventListener('click', function () {
      var err = validateStep(key);
      if (err) { flashError(err); return; }
      stepIdx = Math.min(STEPS.length - 1, stepIdx + 1);
      render();
    });

    var print = document.getElementById('btn-print');
    if (print) print.addEventListener('click', function () { window.print(); });
    var restart = document.getElementById('btn-restart');
    if (restart) restart.addEventListener('click', function () {
      if (confirm('Clear your Forge worksheet and start over?')) {
        localStorage.removeItem(DRAFT_KEY);
        localStorage.removeItem(CHECK_KEY);
        location.reload();
      }
    });
    var boxes = app.querySelectorAll('input[data-step]');
    boxes.forEach(function (cb) {
      cb.addEventListener('change', function () {
        var cur = load(CHECK_KEY, {});
        cur[cb.getAttribute('data-step')] = cb.checked;
        save(CHECK_KEY, cur);
      });
    });
  }

  function onInput(e) {
    var t = e.target;
    if (!t.id && !t.name) return;
    var id = t.id;
    if (id === 'f-name') draft.name = t.value;
    else if (id === 'f-reserve') draft.reserveName = t.checked;
    else if (id === 'f-street') draft.street = t.value;
    else if (id === 'f-city') draft.city = t.value;
    else if (id === 'f-st') draft.st = t.value;
    else if (id === 'f-zip') draft.zip = t.value;
    else if (id === 'f-email') draft.email = t.value;
    else if (t.name === 'texasOps') draft.texasOps = t.value;
    else if (t.name === 'agent') draft.agent = t.value;
    else if (t.name === 'structure') draft.structure = t.value;
    else return;
    save(DRAFT_KEY, draft);
    // live-update fee boxes + texas warning without losing focus
    var key = STEPS[stepIdx];
    if ((key === 'agent' || key === 'name' || key === 'texas') && (t.type === 'checkbox' || t.type === 'radio')) {
      var pos = window.scrollY;
      render();
      window.scrollTo(0, pos);
    }
  }

  // input/change listeners attach ONCE to the persistent container
  app.addEventListener('input', onInput);
  app.addEventListener('change', onInput);

  // state card (single live option — kept as a real step for expansion)
  document.addEventListener('click', function (e) {
    var card = e.target.closest && e.target.closest('.state-card.live');
    if (card && app.contains(card)) {
      draft.state = card.getAttribute('data-state');
      save(DRAFT_KEY, draft);
      stepIdx = Math.min(STEPS.length - 1, stepIdx + 1);
      render();
    }
  });

  render();
})();
