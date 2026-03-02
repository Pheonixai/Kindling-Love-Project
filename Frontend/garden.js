/* ============================================================
   Kindling — Love Garden  |  garden.js
   Vanilla JS — all interactivity
   ============================================================ */

// ── DATA ──────────────────────────────────────────────────────
const BLOOMS = [
  { id: 1, emoji: '🌷', quote: "I wish someone noticed when I'm holding back tears and still showing up.",            resonance: 61,  age: '3h ago',  spark: true,  type: 'blooming' },
  { id: 2, emoji: '🌼', quote: "How hard I try even when no one's watching.",                                        resonance: 45,  age: '5h ago',  spark: false, type: 'full'     },
  { id: 3, emoji: '🌸', quote: "That I'm funny. I feel invisible in groups.",                                        resonance: 88,  age: '8h ago',  spark: true,  type: 'full'     },
  { id: 4, emoji: '🌺', quote: "How much I've grown this year, even if I look the same.",                            resonance: 113, age: '12h ago', spark: false, type: 'full'     },
  { id: 5, emoji: '🌱', quote: "That I say yes even when I'm exhausted, just to feel needed.",                       resonance: 12,  age: '1h ago',  spark: false, type: 'new'      },
  { id: 6, emoji: '🌻', quote: "When I'm proud of something but keep it to myself so I don't seem like I'm bragging.", resonance: 74, age: '1d ago', spark: false, type: 'full'   },
  { id: 7, emoji: '🌷', quote: "I hold space for everyone. I haven't had someone hold it for me in a long time.",    resonance: 200, age: '2d ago',  spark: true,  type: 'full'     },
  { id: 8, emoji: '🌼', quote: "That sometimes I laugh loudest when I feel most alone.",                             resonance: 56,  age: '2d ago',  spark: false, type: 'full'     },
];

const EMOJI_OPTIONS = ['🌸','🌷','🌼','🌺','🌻','🌹','💐','🌱'];

// Working state
const state = {
  blooms:    BLOOMS.map(b => ({ ...b })),
  resonated: new Set(),
  filter:    'all',
  modalOpen: false,
};

// ── DOM REFS ──────────────────────────────────────────────────
const grid        = document.querySelector('.flowers-grid');
const filterBtns  = document.querySelectorAll('.filter-pill');
const heroStatEl  = document.querySelector('.hero-stat span:last-child');
const resCountEl  = document.querySelector('.resonance-count');

// ── HELPERS ───────────────────────────────────────────────────
function heartRow(count) {
  const filled = Math.min(5, Math.round(count / 45));
  return Array.from({ length: 5 }, (_, i) =>
    `<span style="opacity:${i < filled ? 1 : i === filled ? 0.4 : 0.15}">♡</span>`
  ).join('');
}

function fmt(n) {
  return n.toLocaleString();
}

function animateCount(el, target) {
  const start    = parseInt(el.textContent.replace(/,/g, '')) || 0;
  const duration = 700;
  const t0       = performance.now();
  function tick(now) {
    const p = Math.min((now - t0) / duration, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(Math.round(start + (target - start) * e));
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ── INJECT DYNAMIC STYLES ─────────────────────────────────────
function injectStyles() {
  const s = document.createElement('style');
  s.textContent = `
    /* Resonate button on each card */
    .resonate-btn {
      display: block;
      margin-top: 14px;
      width: 100%;
      padding: 8px 12px;
      border-radius: 100px;
      border: 1px solid rgba(218,173,175,0.4);
      background: transparent;
      color: var(--text-muted);
      font-size: 0.73rem;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.25s;
      letter-spacing: 0.02em;
    }
    .resonate-btn:hover {
      border-color: var(--pink-sorbet);
      color: var(--pink-sorbet);
      background: rgba(244,151,142,0.06);
    }
    .resonate-btn.resonated {
      background: rgba(244,151,142,0.1);
      border-color: rgba(244,151,142,0.35);
      color: var(--pink-sorbet);
    }

    /* Burst hearts */
    .burst-heart {
      position: absolute;
      pointer-events: none;
      font-size: 13px;
      color: var(--pink-sorbet);
      z-index: 99;
      transition: transform 0.65s ease, opacity 0.65s ease;
    }

    /* Emoji option button */
    .emoji-opt {
      font-size: 1.45rem;
      border-radius: 12px;
      width: 44px; height: 44px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .emoji-opt:hover { transform: scale(1.14); }

    /* Toast */
    .k-toast {
      background: rgba(255,255,255,0.96);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(244,151,142,0.3);
      border-radius: 100px;
      padding: 10px 22px;
      font-size: 0.82rem;
      color: var(--charcoal);
      box-shadow: 0 8px 32px rgba(0,0,0,0.07);
      opacity: 0;
      transform: translateY(12px);
      transition: opacity 0.4s, transform 0.4s;
      white-space: nowrap;
    }
    .k-toast.show {
      opacity: 1;
      transform: translateY(0);
    }

    /* Modal overlay */
    .k-overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(248,237,235,0.72);
      backdrop-filter: blur(16px);
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      opacity: 0; transition: opacity 0.35s;
    }
    .k-overlay.show { opacity: 1; }

    /* Modal card */
    .k-modal {
      background: white;
      border-radius: 28px;
      padding: 40px 36px;
      max-width: 480px; width: 100%;
      box-shadow: 0 40px 80px rgba(0,0,0,0.08);
      border: 1px solid rgba(218,173,175,0.2);
      position: relative;
      transform: scale(0.94) translateY(16px);
      transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
    }
    .k-overlay.show .k-modal { transform: scale(1) translateY(0); }

    /* Modal close button */
    .k-close {
      position: absolute; top: 18px; right: 18px;
      background: rgba(218,173,175,0.15); border: none;
      border-radius: 50%; width: 32px; height: 32px;
      cursor: pointer; font-size: 1rem; color: var(--text-muted);
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s;
    }
    .k-close:hover { background: rgba(218,173,175,0.3); }

    /* Textarea in plant modal */
    #seed-input:focus { border-color: var(--pink-sorbet) !important; outline: none; }
  `;
  document.head.appendChild(s);
}

// ── RENDER GRID ───────────────────────────────────────────────
function getFiltered() {
  if (state.filter === 'new')  return state.blooms.filter(b => b.type === 'new' || b.type === 'blooming');
  if (state.filter === 'full') return state.blooms.filter(b => b.type === 'full');
  return state.blooms;
}

function buildCard(bloom) {
  const done = state.resonated.has(bloom.id);
  const card = document.createElement('div');
  card.className = `flower-card${bloom.type === 'new' || bloom.type === 'blooming' ? ' blooming' : ''}`;
  card.dataset.id   = bloom.id;
  card.dataset.type = bloom.type;

  card.innerHTML = `
    ${bloom.spark ? '<div class="spark-badge active"></div>' : ''}
    <span class="flower-bloom">${bloom.emoji}</span>
    <p class="flower-quote">"${bloom.quote}"</p>
    <div class="flower-meta">
      <div class="flower-resonance">
        <div class="resonance-hearts">${heartRow(bloom.resonance)}</div>
        <span class="res-num">${bloom.resonance}</span>
      </div>
      <span class="flower-age">${bloom.age}</span>
    </div>
    <button class="resonate-btn${done ? ' resonated' : ''}" aria-label="Resonate">
      ${done ? '🌸 felt this' : '🤍 I feel this'}
    </button>
  `;

  // Resonate button — stop propagation so it doesn't open modal
  card.querySelector('.resonate-btn').addEventListener('click', e => {
    e.stopPropagation();
    handleResonate(bloom.id, card);
  });

  // Card body → open detail modal
  card.addEventListener('click', () => openBloomModal(bloom.id));

  return card;
}

function buildPlantCard() {
  const card = document.createElement('div');
  card.className = 'flower-card your-post';
  card.innerHTML = `
    <span class="post-icon">🌱</span>
    <span class="post-label">Plant a seed</span>
    <p class="post-sub">What do you wish someone noticed about you?</p>
  `;
  card.addEventListener('click', openPlantModal);
  return card;
}

function renderGrid() {
  grid.innerHTML = '';
  getFiltered().forEach(b => grid.appendChild(buildCard(b)));
  grid.appendChild(buildPlantCard());
}

// ── FILTER PILLS ──────────────────────────────────────────────
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const label = btn.textContent.trim().toLowerCase();
    state.filter = label === 'all' ? 'all' : label === 'new seeds' ? 'new' : 'full';
    renderGrid();
  });
});

// ── RESONATE LOGIC ────────────────────────────────────────────
function handleResonate(id, card) {
  const bloom = state.blooms.find(b => b.id === id);
  if (!bloom) return;

  const btn     = card.querySelector('.resonate-btn');
  const numEl   = card.querySelector('.res-num');
  const hearts  = card.querySelector('.resonance-hearts');

  if (state.resonated.has(id)) {
    state.resonated.delete(id);
    bloom.resonance--;
    if (btn) { btn.textContent = '🤍 I feel this'; btn.classList.remove('resonated'); }
  } else {
    state.resonated.add(id);
    bloom.resonance++;
    if (btn) { btn.textContent = '🌸 felt this';  btn.classList.add('resonated'); }
    burstHearts(card);
    showToast('Your resonance was felt 🌸');
  }

  if (numEl)  numEl.textContent = bloom.resonance;
  if (hearts) hearts.innerHTML  = heartRow(bloom.resonance);
  syncStats();
}

function burstHearts(el) {
  el.style.position = 'relative';
  for (let i = 0; i < 7; i++) {
    const h   = document.createElement('span');
    h.className = 'burst-heart';
    h.textContent = '♡';
    const angle = Math.random() * 360;
    const dist  = 36 + Math.random() * 44;
    h.style.left = '50%';
    h.style.top  = '50%';
    h.style.transform = 'translate(-50%,-50%)';
    el.appendChild(h);
    requestAnimationFrame(() => {
      const rad = angle * Math.PI / 180;
      h.style.transform = `translate(calc(-50% + ${Math.cos(rad)*dist}px), calc(-50% + ${Math.sin(rad)*dist}px))`;
      h.style.opacity = '0';
    });
    setTimeout(() => h.remove(), 700);
  }
}

// ── STATS SYNC ────────────────────────────────────────────────
function syncStats() {
  const statNums = document.querySelectorAll('.g-stat-num');
  if (statNums[1]) {
    const total = state.blooms.reduce((s, b) => s + b.resonance, 0);
    animateCount(statNums[1], total);
  }
  if (statNums[0]) {
    animateCount(statNums[0], state.blooms.length + 1196);
  }
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg) {
  let wrap = document.getElementById('k-toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'k-toast-wrap';
    wrap.style.cssText = 'position:fixed;bottom:32px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;align-items:center;gap:10px;pointer-events:none;';
    document.body.appendChild(wrap);
  }
  const t = document.createElement('div');
  t.className = 'k-toast';
  t.textContent = msg;
  wrap.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 420);
  }, 2800);
}

// ── BLOOM DETAIL MODAL ────────────────────────────────────────
function openBloomModal(id) {
  if (state.modalOpen) return;
  const bloom = state.blooms.find(b => b.id === id);
  if (!bloom) return;
  state.modalOpen = true;

  const done    = state.resonated.has(id);
  const overlay = document.createElement('div');
  overlay.className = 'k-overlay';

  overlay.innerHTML = `
    <div class="k-modal">
      <button class="k-close">✕</button>

      <div style="font-size:2.6rem;text-align:center;margin-bottom:20px;">${bloom.emoji}</div>

      <p style="font-family:Georgia,serif;font-size:1.15rem;font-style:italic;font-weight:300;
                line-height:1.7;color:var(--charcoal);text-align:center;margin-bottom:28px;">
        "${bloom.quote}"
      </p>

      <div style="display:flex;justify-content:space-between;align-items:center;
                  padding:16px 20px;background:var(--soft-sand);border-radius:14px;margin-bottom:24px;">
        <div>
          <div style="font-size:0.66rem;letter-spacing:0.12em;text-transform:uppercase;
                      color:var(--text-muted);margin-bottom:3px;">resonances</div>
          <div id="m-res" style="font-size:1.6rem;font-family:Georgia,serif;
                                 font-weight:300;color:var(--pink-sorbet);">${bloom.resonance}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.66rem;letter-spacing:0.12em;text-transform:uppercase;
                      color:var(--text-muted);margin-bottom:3px;">planted</div>
          <div style="font-size:0.88rem;color:var(--charcoal);">${bloom.age}</div>
        </div>
      </div>

      ${bloom.spark ? `
        <div style="background:linear-gradient(135deg,rgba(244,151,142,0.1),rgba(218,173,175,0.07));
                    border:1px solid rgba(244,151,142,0.2);border-radius:14px;
                    padding:14px 18px;display:flex;align-items:center;gap:12px;margin-bottom:24px;">
          <span style="font-size:1.1rem;">✨</span>
          <p style="font-size:0.78rem;color:var(--text-muted);line-height:1.5;margin:0;">
            A <strong style="color:var(--charcoal);">Spark</strong> is active — someone resonated deeply.
            A brief, gentle connection may be possible.
          </p>
        </div>
      ` : ''}

      <button id="m-res-btn" style="
        width:100%;padding:14px;border-radius:100px;border:none;cursor:pointer;
        background:${done ? 'var(--soft-sand)' : 'var(--pink-sorbet)'};
        color:${done ? 'var(--text-muted)' : 'white'};
        font-size:0.88rem;font-family:inherit;transition:all 0.25s;letter-spacing:0.02em;
      ">${done ? '🌸 You felt this' : '🤍 I feel this too'}</button>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  const close = () => {
    overlay.classList.remove('show');
    setTimeout(() => { overlay.remove(); state.modalOpen = false; }, 360);
  };

  overlay.querySelector('.k-close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function onEsc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); }
  });

  // Resonate from modal
  overlay.querySelector('#m-res-btn').addEventListener('click', () => {
    // Find the card in the live grid (if visible)
    const liveCard = grid.querySelector(`[data-id="${id}"]`) || document.createElement('div');
    handleResonate(bloom.id, liveCard);

    const nowDone = state.resonated.has(bloom.id);
    const btn = overlay.querySelector('#m-res-btn');
    const resEl = overlay.querySelector('#m-res');
    btn.style.background = nowDone ? 'var(--soft-sand)' : 'var(--pink-sorbet)';
    btn.style.color      = nowDone ? 'var(--text-muted)' : 'white';
    btn.textContent      = nowDone ? '🌸 You felt this'  : '🤍 I feel this too';
    resEl.textContent    = bloom.resonance;
    if (nowDone) burstHearts(overlay.querySelector('.k-modal'));
  });
}

// ── PLANT A SEED MODAL ────────────────────────────────────────
function openPlantModal() {
  if (state.modalOpen) return;
  state.modalOpen = true;

  const overlay = document.createElement('div');
  overlay.className = 'k-overlay';

  overlay.innerHTML = `
    <div class="k-modal">
      <button class="k-close">✕</button>

      <p style="font-size:0.66rem;letter-spacing:0.18em;text-transform:uppercase;
                color:var(--dusty-rose);margin-bottom:10px;">Plant a seed</p>
      <h3 style="font-family:Georgia,serif;font-size:1.45rem;font-weight:300;
                 color:var(--charcoal);margin-bottom:6px;line-height:1.3;">
        What do you wish someone noticed about you?
      </h3>
      <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:26px;line-height:1.5;">
        Posted anonymously. Your words may bloom for someone who needs them.
      </p>

      <!-- Emoji picker -->
      <div style="margin-bottom:20px;">
        <label style="font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;
                      color:var(--text-muted);display:block;margin-bottom:8px;">Choose your bloom</label>
        <div id="emoji-row" style="display:flex;gap:8px;flex-wrap:wrap;">
          ${EMOJI_OPTIONS.map((e, i) => `
            <button class="emoji-opt" data-emoji="${e}" style="
              background:${i===0?'rgba(244,151,142,0.15)':'rgba(218,173,175,0.08)'};
              border:${i===0?'1.5px solid var(--pink-sorbet)':'1.5px solid transparent'};
            ">${e}</button>
          `).join('')}
        </div>
      </div>

      <!-- Text input -->
      <textarea id="seed-input" maxlength="120" placeholder="I wish someone noticed…" style="
        width:100%;min-height:108px;padding:16px;
        background:var(--soft-sand);border:1.5px solid rgba(218,173,175,0.3);
        border-radius:16px;font-size:0.95rem;font-family:Georgia,serif;font-style:italic;
        color:var(--charcoal);resize:none;line-height:1.65;margin-bottom:6px;
        transition:border-color 0.25s;
      "></textarea>
      <div id="char-count" style="font-size:0.66rem;color:var(--text-muted);
                                  text-align:right;margin-bottom:20px;">0 / 120</div>

      <button id="submit-btn" disabled style="
        width:100%;padding:14px;border-radius:100px;border:none;cursor:not-allowed;
        background:rgba(218,173,175,0.3);color:rgba(255,255,255,0.7);
        font-size:0.88rem;font-family:inherit;transition:all 0.25s;letter-spacing:0.02em;
      ">🌱 Plant anonymously</button>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  const close = () => {
    overlay.classList.remove('show');
    setTimeout(() => { overlay.remove(); state.modalOpen = false; }, 360);
  };
  overlay.querySelector('.k-close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function onEsc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); }
  });

  // Emoji picker
  let selectedEmoji = EMOJI_OPTIONS[0];
  overlay.querySelectorAll('.emoji-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.emoji-opt').forEach(b => {
        b.style.background = 'rgba(218,173,175,0.08)';
        b.style.border     = '1.5px solid transparent';
      });
      btn.style.background = 'rgba(244,151,142,0.15)';
      btn.style.border     = '1.5px solid var(--pink-sorbet)';
      selectedEmoji = btn.dataset.emoji;
    });
  });

  // Char count + submit gate
  const textarea  = overlay.querySelector('#seed-input');
  const charEl    = overlay.querySelector('#char-count');
  const submitBtn = overlay.querySelector('#submit-btn');
  const MAX = 120;

  function updateSubmit() {
    const len  = textarea.value.length;
    const ok   = textarea.value.trim().length > 8 && len <= MAX;
    charEl.textContent  = `${len} / ${MAX}`;
    charEl.style.color  = len > 100 ? (len === MAX ? '#e07070' : '#c9906a') : 'var(--text-muted)';
    submitBtn.disabled  = !ok;
    submitBtn.style.background  = ok ? 'var(--pink-sorbet)' : 'rgba(218,173,175,0.3)';
    submitBtn.style.color       = ok ? 'white'              : 'rgba(255,255,255,0.6)';
    submitBtn.style.cursor      = ok ? 'pointer'            : 'not-allowed';
  }

  textarea.addEventListener('input', updateSubmit);
  textarea.addEventListener('focus', () => textarea.style.borderColor = 'var(--pink-sorbet)');
  textarea.addEventListener('blur',  () => textarea.style.borderColor = 'rgba(218,173,175,0.3)');

  submitBtn.addEventListener('click', () => {
    const text = textarea.value.trim();
    if (!text || text.length > MAX) return;
    close();
    plantBloom(text, selectedEmoji);
  });

  setTimeout(() => textarea.focus(), 380);
}

// ── PLANT A NEW BLOOM ─────────────────────────────────────────
function plantBloom(text, emoji) {
  const newBloom = {
    id:        Date.now(),
    emoji,
    quote:     text,
    resonance: 0,
    age:       'just now',
    spark:     false,
    type:      'new',
  };

  state.blooms.unshift(newBloom);

  // If filter would hide it, reset to 'all'
  if (state.filter === 'full') {
    state.filter = 'all';
    filterBtns.forEach(b => {
      b.classList.toggle('active', b.textContent.trim().toLowerCase() === 'all');
    });
  }

  renderGrid();

  // Highlight the new card
  const newCard = grid.querySelector(`[data-id="${newBloom.id}"]`);
  if (newCard) {
    newCard.style.outline       = '2px solid rgba(244,151,142,0.45)';
    newCard.style.outlineOffset = '3px';
    newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { newCard.style.outline = 'none'; newCard.style.outlineOffset = '0'; }, 2200);
  }

  syncStats();
  showToast('Your seed was planted 🌱 It may bloom for someone who needs it.');
}

// ── SCROLL REVEAL ─────────────────────────────────────────────
function initScrollReveal() {
  const targets = [
    '.section-label',
    '.seen-banner',
    '.garden-wrapper',
    '.garden-growth',
  ];
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  targets.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.style.opacity    = '0';
      el.style.transform  = 'translateY(22px)';
      el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      obs.observe(el);
    });
  });
}

// ── GROWTH BAR ────────────────────────────────────────────────
function initGrowthBar() {
  const fill = document.querySelector('.growth-fill');
  if (!fill) return;
  fill.style.animation = 'none';
  fill.style.width     = '0%';

  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      fill.style.transition = 'width 1.9s cubic-bezier(0.4,0,0.2,1)';
      fill.style.width      = '68%';
      obs.disconnect();
    }
  }, { threshold: 0.5 });
  obs.observe(fill);
}

// ── SEEN BANNER COUNT-UP ──────────────────────────────────────
function initSeenBanner() {
  if (!resCountEl) return;
  const target = parseInt(resCountEl.textContent) || 38;
  resCountEl.textContent = '0';
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      animateCount(resCountEl, target);
      obs.disconnect();
    }
  }, { threshold: 0.8 });
  obs.observe(resCountEl);
}

// ── LIVE HERO COUNTER (ambient) ───────────────────────────────
function initLiveCounter() {
  if (!heroStatEl) return;
  setInterval(() => {
    if (Math.random() > 0.55) {
      const cur = parseInt(heroStatEl.textContent.replace(/[^0-9]/g, '')) || 1204;
      heroStatEl.textContent = `${fmt(cur + 1)} blooms growing right now`;
      heroStatEl.style.color = 'var(--pink-sorbet)';
      setTimeout(() => { heroStatEl.style.color = ''; }, 900);
    }
  }, 9000);
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  renderGrid();
  initScrollReveal();
  initGrowthBar();
  initSeenBanner();
  initLiveCounter();
});