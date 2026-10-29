(() => {
  if (window.__lucyLoaded) return;
  window.__lucyLoaded = true;

  /* ================= SITE ADAPTERS =================
     If a site changes its layout and Lucy stops working there,
     only these selectors need to be updated. */
  const CLAUDE = {
    input: ['div[contenteditable="true"].ProseMirror', 'div[contenteditable="true"]'],
    send: ['button[aria-label="Send message" i]'],
    stop: ['button[aria-label="Stop response" i]'],
    reply: ['.font-claude-response', '.font-claude-message', '[data-is-streaming]']
  };
  const GPT = {
    input: ['#prompt-textarea', 'div[contenteditable="true"]', 'textarea'],
    send: ['button[data-testid="send-button"]'],
    stop: ['button[data-testid="stop-button"]'],
    reply: ['[data-message-author-role="assistant"]']
  };
  const GEMINI = {
    input: ['rich-textarea .ql-editor', 'div.ql-editor[contenteditable="true"]', 'div[contenteditable="true"]'],
    send: ['button[aria-label*="Send" i]', 'button.send-button'],
    stop: ['button[aria-label*="Stop" i]'],
    reply: ['message-content', '.model-response-text']
  };
  const GENERIC = {
    input: ['textarea', 'div[contenteditable="true"]', '[role="textbox"]'],
    send: ['button[type="submit"]', 'button[aria-label*="send" i]'],
    stop: ['button[aria-label*="stop" i]'],
    reply: ['[data-message-author-role="assistant"]', '.markdown', '.prose', '[class*="assistant"]', '[class*="response"]']
  };
  const H = location.hostname;
  const A = H.includes('claude') ? CLAUDE : (H.includes('chatgpt') || H.includes('openai')) ? GPT : H.includes('gemini') ? GEMINI : GENERIC;

  const visible = el => !!(el && (el.offsetParent || el.getClientRects().length));
  function qLast(sels) {
    for (const s of sels) {
      let n; try { n = [...document.querySelectorAll(s)]; } catch (_) { continue; }
      if (n.length) return n[n.length - 1];
    }
    return null;
  }
  function getInput() {
    for (const s of A.input) {
      let n; try { n = [...document.querySelectorAll(s)].filter(visible); } catch (_) { continue; }
      if (n.length) return n[n.length - 1];
    }
    return null;
  }

  /* ================= LOOKS ================= */
  const SVG = `<canvas id="lucy" width="627" height="627"></canvas>`;

  function city() {
    let s = 7;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const cols = ['#ff2fb3', '#35e6ff', '#8a5bff', '#ff7ad9'];
    let o = '';
    for (let layer = 0; layer < 2; layer++) {
      let x = -20;
      o += `<g opacity="${layer ? 1 : .5}" ${layer ? '' : 'filter="url(#bl)"'}>`;
      while (x < 1620) {
        const w = 50 + r() * 70, h = (layer ? 140 : 230) + r() * (layer ? 250 : 300);
        o += `<rect x="${x | 0}" y="${(600 - h) | 0}" width="${w | 0}" height="${h | 0}" fill="${layer ? '#12072a' : '#1d0c40'}"/>`;
        for (let wy = 600 - h + 12; wy < 590; wy += 14)
          for (let wx = x + 6; wx < x + w - 8; wx += 12)
            if (r() < .2) o += `<rect x="${wx | 0}" y="${wy | 0}" width="5" height="6" fill="${cols[(r() * 4) | 0]}" opacity="${(.4 + r() * .6).toFixed(2)}"/>`;
        if (r() < .25) o += `<rect x="${(x + w * .2) | 0}" y="${(600 - h - 14) | 0}" width="${(w * .6) | 0}" height="5" fill="${cols[(r() * 4) | 0]}"/>`;
        x += w + r() * 8;
      }
      o += '</g>';
    }
    return `<svg viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
<defs><filter id="bl"><feGaussianBlur stdDeviation="2.5"/></filter>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05010f"/><stop offset=".6" stop-color="#1f0846"/><stop offset="1" stop-color="#5a1370"/></linearGradient></defs>
<rect width="1600" height="600" fill="url(#sky)"/>${o}</svg>`;
  }

  const CSS = `
:host{all:initial}
*{box-sizing:border-box}
button{font:400 11px 'Segoe UI',system-ui,sans-serif;letter-spacing:.04em;background:rgba(20,6,40,.55);color:#ffd9f6;border:1px solid rgba(255,120,220,.45);border-radius:12px;padding:5px 11px;cursor:pointer}
button:hover{background:rgba(255,60,200,.25)}
button.on{background:rgba(255,50,190,.55);color:#fff}
#launch{position:fixed;right:18px;bottom:100px;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#ff7ee0,#6a2bd1);color:#fff;font:600 19px 'Segoe UI',sans-serif;cursor:pointer;box-shadow:0 0 16px #ff3ec8;z-index:2147483646;user-select:none}
#launch.live{animation:lp 1.6s infinite}
@keyframes lp{50%{box-shadow:0 0 30px #35e6ff}}
#win{display:none;position:fixed;width:310px;height:430px;min-width:230px;min-height:300px;resize:both;overflow:hidden;flex-direction:column;border-radius:16px;background:#080314;border:1px solid rgba(255,80,200,.45);box-shadow:0 0 26px rgba(255,60,200,.35);z-index:2147483647;font-family:'Segoe UI',system-ui,sans-serif;color:#f3e9ff}
#win.open{display:flex}
#win.full{left:0!important;top:0!important;width:100vw!important;height:100vh!important;border-radius:0;resize:none;border:0}
#bg{position:absolute;inset:0;opacity:.45;pointer-events:none}
#bg svg{width:100%;height:100%;display:block}
#bg::after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,rgba(8,3,20,.55),rgba(8,3,20,0) 40%,rgba(8,3,20,.5))}
.full #bg{opacity:1}
#hdr{position:relative;z-index:3;display:flex;align-items:center;gap:6px;padding:9px 10px;cursor:move;font-size:12px;letter-spacing:.06em;color:#ffb8ee;user-select:none}
.full #hdr{cursor:default}
#hdr .sp{flex:1}
#status::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:#6b6280;margin-right:8px}
[data-state=listening] #status::before{background:#35e6ff;box-shadow:0 0 9px #35e6ff}
[data-state=thinking] #status::before{background:#ff3ec8;box-shadow:0 0 9px #ff3ec8;animation:bt .8s infinite}
[data-state=speaking] #status::before{background:#9dff7a;box-shadow:0 0 9px #9dff7a}
#stage{position:relative;flex:1;min-height:0;z-index:1}
#lucy{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:50% 100%;filter:drop-shadow(0 0 4px rgba(255,60,200,.75)) drop-shadow(0 0 16px rgba(130,80,255,.65))}
[data-state=speaking] #lucy{filter:drop-shadow(0 0 5px rgba(255,90,210,.95)) drop-shadow(0 0 24px rgba(150,90,255,.8))}
[data-state=thinking] #lucy{animation:gp 1.2s ease-in-out infinite}
@keyframes gp{50%{filter:drop-shadow(0 0 8px rgba(255,60,200,1)) drop-shadow(0 0 34px rgba(60,230,255,.85))}}
@keyframes fl{0%,100%,90%,94%,97%{opacity:1}92%{opacity:.7}95%{opacity:.85}}
.float{animation:fy 4.5s ease-in-out infinite}
@keyframes fy{50%{transform:translateY(-6px)}}
.head{transform-origin:200px 345px;animation:sw 7s ease-in-out infinite}
@keyframes sw{0%,100%{transform:rotate(-1.1deg)}50%{transform:rotate(1.1deg)}}
[data-state=thinking] .head{animation:none;transform:rotate(-4deg) translateY(-2px);transition:transform .6s}
[data-state=speaking] .head{animation:tk 1.3s ease-in-out infinite}
@keyframes tk{0%,100%{transform:rotate(-.8deg) translateY(0)}35%{transform:rotate(.8deg) translateY(2px)}70%{transform:rotate(-.4deg) translateY(-1px)}}
.eye{transform-origin:50% 226px;transform-box:view-box;transition:transform .07s}
#eyeL{transform-origin:170px 226px}#eyeR{transform-origin:230px 226px}
.eye.shut{transform:scaleY(.07)}
.iris{transition:transform .3s}
[data-state=thinking] .iris{animation:gl 1.8s ease-in-out infinite alternate}
@keyframes gl{from{transform:translate(-4px,-7px)}to{transform:translate(4px,-7px)}}
#proc{position:absolute;top:4px;left:0;right:0;text-align:center;font:300 12px 'Segoe UI',sans-serif;letter-spacing:.3em;color:#ff9be8;text-shadow:0 0 8px #ff3ec8;opacity:0;pointer-events:none}
[data-state=thinking] #proc{opacity:1;animation:bt 1.1s infinite}
@keyframes bt{50%{opacity:.35}}
#sub{position:relative;z-index:3;min-height:38px;padding:6px 16px 8px;text-align:center;font:300 13px/1.45 'Segoe UI Light','Segoe UI',sans-serif;letter-spacing:.02em;color:#f1e6ff;text-shadow:0 0 8px rgba(255,60,200,.8),0 1px 2px #000}
#sub.user{color:#9fefff;font-style:italic}
.full #sub{font-size:19px;min-height:60px;padding-bottom:12px}
.nocc #sub{visibility:hidden}
#bar{position:relative;z-index:3;display:flex;gap:7px;justify-content:center;padding:6px 10px 11px}
.full #bar button{font-size:13px;padding:7px 16px}
#warn{font-size:10px;color:#ffb347;margin-left:8px;letter-spacing:.02em;text-transform:none}
#set{display:none;position:absolute;z-index:5;left:10px;right:10px;top:42px;bottom:52px;overflow:auto;background:rgba(10,4,24,.97);border:1px solid rgba(255,120,220,.4);border-radius:12px;padding:12px;font:300 12px 'Segoe UI',sans-serif;color:#f1e6ff}
.full #set{left:50%;right:auto;width:460px;transform:translateX(-50%)}
#set label{display:block;margin-bottom:9px;color:#ffb8ee}
#set input,#set select{display:block;width:100%;margin-top:3px;padding:5px 7px;background:#150a2c;color:#fff;border:1px solid rgba(255,120,220,.35);border-radius:8px;font:12px 'Segoe UI',sans-serif}
#set input[type=range]{padding:0}
#set .row{display:flex;gap:8px;margin-top:6px}
#sInfo{margin:4px 0 8px;color:#9fefff;font-size:11px}
`;

  const HTML = `
<div id="launch" title="Open Lucy">L</div>
<div id="win" data-state="idle">
  <div id="bg">${city()}</div>
  <div id="hdr"><span id="status">Idle</span><span id="warn"></span><span class="sp"></span><button id="bFull" title="Full screen (Esc to exit)">Full screen</button><button id="bMin" title="Minimize">Hide</button></div>
  <div id="stage">${SVG}<div id="proc">Processing...</div></div>
  <div id="set">
    <label>Voice engine<select id="sEng"><option value="eleven">ElevenLabs (natural voice)</option><option value="chrome">Free Chrome voice</option></select></label>
    <label>ElevenLabs API key<input id="sKey" type="password" autocomplete="off" placeholder="paste your key here"></label>
    <label>ElevenLabs voice ID<input id="sVid" autocomplete="off" placeholder="paste the voice ID here"></label>
    <label>Quality<select id="sMod"><option value="eleven_flash_v2_5">Saves credits (Flash)</option><option value="eleven_multilingual_v2">Best quality (uses more credits)</option></select></label>
    <label>Free Chrome voice (backup)<select id="sCv"></select></label>
    <label>Backup voice speed<input id="sRate" type="range" min="0.7" max="1.4" step="0.05"></label>
    <label>Backup voice pitch<input id="sPitch" type="range" min="0.6" max="1.6" step="0.05"></label>
    <div id="sInfo"></div>
    <div class="row"><button id="sTest">Test voice</button><button id="sSave">Save and close</button></div>
  </div>
  <div id="sub"></div>
  <div id="bar"><button id="bCall">Start call</button><button id="bMode" title="Exact: reads every word. Summary: reads only the key points.">Exact</button><button id="bCC" class="on">Subtitles</button><button id="bVoice">Voice</button></div>
</div>`;

  /* ================= BUILD UI ================= */
  const host = document.createElement('div');
  host.id = 'lucy-host';
  const sh = host.attachShadow({ mode: 'open' });
  sh.innerHTML = `<style>${CSS}</style>${HTML}`;
  document.documentElement.appendChild(host);
  const $ = s => sh.querySelector(s);
  const win = $('#win'), launch = $('#launch'), sub = $('#sub'), status = $('#status');
  const hdr = $('#hdr');
  const bCall = $('#bCall'), bMode = $('#bMode'), bCC = $('#bCC');

  /* ================= STATE ================= */
  let call = false, state = 'idle', mode = 'exact', cc = true;
  let pending = '', lastInterim = '', sendTimer = null, thinkSince = 0;
  let speaking = false, mouthTimer = null, curChunk = '', voice = null;
  let lastSig = '', lastChange = Date.now(), lastSpoken = '';
  let rec = null;
  const LABEL = { idle: 'Idle', listening: 'Listening', thinking: 'Thinking', speaking: 'Speaking' };

  function setState(s) {
    state = s; win.dataset.state = s; status.textContent = LABEL[s];
    if (s === 'thinking') thinkSince = Date.now();
  }
  function showSub(t, isUser) { sub.textContent = t || ''; sub.classList.toggle('user', !!isUser); }

  const cfg = { engine: 'chrome', key: '', voiceId: '', model: 'eleven_flash_v2_5', chromeVoice: '', rate: 1, pitch: 1.1, used: 0, usedMonth: '' };
  try {
    chrome.storage.local.get(['mode', 'cc', 'cfg'], r => {
      if (r.mode) mode = r.mode;
      if (typeof r.cc === 'boolean') cc = r.cc;
      if (r.cfg) Object.assign(cfg, r.cfg);
      paintButtons(); fillSettings();
    });
  } catch (_) {}
  function save() { try { chrome.storage.local.set({ mode, cc, cfg }); } catch (_) {} }
  function paintButtons() {
    bMode.textContent = mode === 'exact' ? 'Exact' : 'Summary';
    bCC.classList.toggle('on', cc);
    win.classList.toggle('nocc', !cc);
  }
  paintButtons();

  /* ================= WINDOW BEHAVIOUR ================= */
  function openWin() {
    if (!win.style.left) {
      win.style.left = Math.max(10, innerWidth - 330) + 'px';
      win.style.top = Math.max(10, innerHeight - 450) + 'px';
    }
    win.classList.add('open'); launch.style.display = 'none';
  }
  function hideWin() { win.classList.remove('open'); launch.style.display = 'grid'; }
  launch.onclick = openWin;
  $('#bMin').onclick = hideWin;
  $('#bFull').onclick = () => {
    win.classList.toggle('full');
    $('#bFull').textContent = win.classList.contains('full') ? 'Exit full screen' : 'Full screen';
  };
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && win.classList.contains('full')) $('#bFull').click();
  }, true);
  bMode.onclick = () => { mode = mode === 'exact' ? 'summary' : 'exact'; paintButtons(); save(); };
  bCC.onclick = () => { cc = !cc; paintButtons(); save(); };

  hdr.addEventListener('pointerdown', e => {
    if (win.classList.contains('full') || e.target.closest('button')) return;
    const r = win.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
    hdr.setPointerCapture(e.pointerId);
    const mv = ev => {
      win.style.left = Math.max(0, Math.min(innerWidth - 80, ev.clientX - dx)) + 'px';
      win.style.top = Math.max(0, Math.min(innerHeight - 40, ev.clientY - dy)) + 'px';
    };
    const up = () => { hdr.removeEventListener('pointermove', mv); hdr.removeEventListener('pointerup', up); };
    hdr.addEventListener('pointermove', mv); hdr.addEventListener('pointerup', up);
  });

  /* ================= FACE (real images) ================= */
  const FR = {};
  const cv = $('#lucy'), cx = cv.getContext('2d');
  let mouthKey = 'closed', blinkUntil = 0, glitchUntil = 0, nextGlitch = 2500;
  ['neutral', 'small', 'wide', 'blink', 'think'].forEach(n => {
    fetch(chrome.runtime.getURL('lucy/' + n + '.png'))
      .then(r => r.blob()).then(b => createImageBitmap(b))
      .then(bm => { FR[n] = bm; })
      .catch(() => showSub('Could not load Lucy images. Keep the "lucy" folder next to lucy.js.'));
  });
  function setMouth(k) { mouthKey = k; }
  function animateMouth() {
    const r = Math.random();
    setMouth(r < .2 ? 'closed' : r < .6 ? 'small' : 'wide');
  }
  (function blinkLoop() {
    blinkUntil = performance.now() + 130;
    setTimeout(blinkLoop, 2200 + Math.random() * 3800);
  })();
  function pickFrame(now) {
    if (state === 'thinking') return FR.think;
    if (state === 'speaking') return mouthKey === 'wide' ? FR.wide : mouthKey === 'small' ? FR.small : FR.neutral;
    return now < blinkUntil ? FR.blink : FR.neutral;
  }
  function render(now) {
    requestAnimationFrame(render);
    const img = pickFrame(now) || FR.neutral;
    if (!img) return;
    const W = cv.width, H = cv.height, t = now / 1000;
    cx.clearRect(0, 0, W, H);
    if (now > nextGlitch) {
      glitchUntil = now + 130 + Math.random() * 120;
      nextGlitch = now + (state === 'thinking' ? 600 + Math.random() * 900 : 3500 + Math.random() * 4500);
    }
    const glitching = now < glitchUntil;
    cx.save();
    cx.translate(W / 2, H); cx.rotate(Math.sin(t * .9) * .008); cx.scale(1.04, 1.04);
    cx.translate(-W / 2, -H + (Math.sin(t * 1.4) - 1) * 3 + (state === 'speaking' ? Math.sin(t * 5) * 1.5 : 0));
    if (glitching) {
      cx.globalAlpha = .55;
      cx.filter = 'hue-rotate(150deg) saturate(2.2)'; cx.drawImage(img, 7, 0);
      cx.filter = 'hue-rotate(-70deg) saturate(2.2)'; cx.drawImage(img, -7, 0);
      cx.filter = 'none'; cx.globalAlpha = 1;
      for (let y = 0; y < H; y += 8 + Math.random() * 40) {
        const sh = 6 + Math.random() * 30, dx = Math.random() < .5 ? (Math.random() - .5) * 26 : 0;
        cx.drawImage(img, 0, y, W, sh, dx, y, W, sh);
      }
    } else cx.drawImage(img, 0, 0);
    cx.restore();
    cx.globalCompositeOperation = 'destination-out';
    cx.fillStyle = 'rgba(0,0,0,.4)';
    const off = (now / 70) % 5;
    for (let y = -5 + off; y < H; y += 5) cx.fillRect(0, y, W, 2);
    cx.globalCompositeOperation = 'source-atop';
    const g = cx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(255,60,200,.14)'); g.addColorStop(1, 'rgba(110,70,255,.22)');
    cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    const by = ((now / 18) % (H + 240)) - 120, bg = cx.createLinearGradient(0, by - 60, 0, by + 60);
    bg.addColorStop(0, 'rgba(255,200,250,0)'); bg.addColorStop(.5, 'rgba(255,200,250,.2)'); bg.addColorStop(1, 'rgba(255,200,250,0)');
    cx.fillStyle = bg; cx.fillRect(0, by - 60, W, 120);
    cx.globalCompositeOperation = 'source-over';
  }
  requestAnimationFrame(render);

  /* ================= TEXT HELPERS ================= */
  function speechText(el) {
    let t = el.innerText || '';
    el.querySelectorAll('pre').forEach(p => {
      const c = (p.innerText || '').trim();
      if (c) t = t.replace(c, ' I have left the code on screen. ');
    });
    el.querySelectorAll('table').forEach(p => {
      const c = (p.innerText || '').trim();
      if (c) t = t.replace(c, ' I have left the table on screen. ');
    });
    return t
      .replace(/https?:\/\/\S+/g, ' link ')
      .replace(/[\p{Extended_Pictographic}\u200d\ufe0f]/gu, '')
      .replace(/^\s*(Copy|Copy code|Edit|Retry)\s*$/gim, '')
      .replace(/[*_#>`~|•◦▪]/g, ' ')
      .replace(/([^.!?:;,\n])\n+/g, '$1. ')
      .replace(/\s+/g, ' ').trim();
  }
  const STOP = new Set('the and for that this with from have will your you are was were not but can has had its into than then them they their there what when which would could should about also been more some such only very just like over'.split(' '));
  function summarize(t) {
    const s = (t.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []).map(x => x.trim()).filter(Boolean);
    if (s.length <= 3) return t;
    const f = {};
    (t.toLowerCase().match(/[a-z']{4,}/g) || []).forEach(w => { if (!STOP.has(w)) f[w] = (f[w] || 0) + 1; });
    const sc = s.map((x, i) => {
      const w = x.toLowerCase().match(/[a-z']{4,}/g) || [];
      return { i, v: w.reduce((a, b) => a + (f[b] || 0), 0) / Math.sqrt(w.length + 3) + (i === 0 ? 3 : 0) };
    });
    const keep = sc.sort((a, b) => b.v - a.v).slice(0, 3).map(x => x.i).sort((a, b) => a - b);
    return keep.map(i => s[i]).join(' ');
  }
  function chunks(t, max = 200) {
    const s = t.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [], out = [];
    let cur = '';
    s.forEach(x => {
      if ((cur + x).length > max && cur) { out.push(cur.trim()); cur = ''; }
      cur += x + ' ';
    });
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function pickVoice() {
    const v = speechSynthesis.getVoices().filter(x => /^en/i.test(x.lang));
    for (const p of [/Aria/i, /Jenny/i, /Zira/i, /Google UK English Female/i, /Samantha/i, /Female/i, /Google US English/i]) {
      const f = v.find(x => p.test(x.name)); if (f) return f;
    }
    return v[0] || null;
  }
  speechSynthesis.onvoiceschanged = () => { voice = pickVoice(); try { fillVoices(); } catch (_) {} };
  voice = pickVoice();

  /* ================= SPEAKING ================= */
  let actx = null, analyser = null, curSrc = null, token = 0, audioOn = false;
  function ensureAudio() {
    if (!actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = actx.createAnalyser(); analyser.fftSize = 512; analyser.connect(actx.destination);
    }
    if (actx.state === 'suspended') actx.resume();
  }
  const useEleven = () => cfg.engine === 'eleven' && cfg.key && cfg.voiceId;
  function warn(msg) {
    const w = sh.querySelector('#warn'); w.textContent = msg;
    setTimeout(() => { if (w.textContent === msg) w.textContent = ''; }, 9000);
  }
  function addUsed(n) {
    const m = new Date().toISOString().slice(0, 7);
    if (cfg.usedMonth !== m) { cfg.usedMonth = m; cfg.used = 0; }
    cfg.used += n; save();
  }
  function chromeVoice() { return speechSynthesis.getVoices().find(x => x.name === cfg.chromeVoice) || voice; }
  function b64ToBuf(b) {
    const bin = atob(b), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u.buffer;
  }
  function elevenFetch(text) {
    return new Promise((res, rej) => {
      try {
        chrome.runtime.sendMessage({ type: 'tts', text, voiceId: cfg.voiceId, key: cfg.key, model: cfg.model }, r => {
          if (chrome.runtime.lastError) return rej(new Error('extension was reloaded, refresh the page'));
          if (!r || !r.ok) return rej(new Error((r && r.error) || 'no answer'));
          res(r.audio);
        });
      } catch (e) { rej(new Error('extension was reloaded, refresh the page')); }
    }).then(b => actx.decodeAudioData(b64ToBuf(b))).then(buf => { addUsed(text.length); return buf; });
  }
  function playBuf(buf, my) {
    return new Promise(res => {
      if (my !== token) return res();
      const src = actx.createBufferSource();
      src.buffer = buf; src.connect(analyser); curSrc = src; audioOn = true;
      src.onended = () => { audioOn = false; res(); };
      src.start();
    });
  }
  async function speakEleven(list, my) {
    let p = elevenFetch(list[0]); p.catch(() => {});
    for (let i = 0; i < list.length; i++) {
      let buf;
      try { buf = await p; } catch (e) { return { failedAt: i, err: e }; }
      if (my !== token) return {};
      if (i + 1 < list.length) { p = elevenFetch(list[i + 1]); p.catch(() => {}); }
      curChunk = list[i]; showSub(curChunk);
      await playBuf(buf, my);
      if (my !== token) return {};
    }
    return {};
  }
  function speakChrome(list, my) {
    return new Promise(done => {
      let i = 0;
      const next = () => {
        if (my !== token || i >= list.length) return done();
        curChunk = list[i++];
        const u = new SpeechSynthesisUtterance(curChunk);
        const v = chromeVoice(); if (v) u.voice = v;
        u.rate = cfg.rate; u.pitch = cfg.pitch; u.lang = 'en-US';
        u.onboundary = () => setMouth('wide');
        u.onend = next; u.onerror = next;
        showSub(curChunk);
        speechSynthesis.speak(u);
      };
      next();
    });
  }
  function startMouth() {
    clearInterval(mouthTimer);
    const data = new Uint8Array(512);
    mouthTimer = setInterval(() => {
      if (audioOn && analyser) {
        analyser.getByteTimeDomainData(data);
        let s = 0; for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; s += v * v; }
        const r = Math.sqrt(s / data.length);
        setMouth(r > .12 ? 'wide' : r > .035 ? 'small' : 'closed');
      } else animateMouth();
    }, 70);
  }
  async function speak(text) {
    stopSpeaking(true);
    const my = ++token;
    const list = chunks(text, useEleven() ? 250 : 200);
    if (!list.length) { setState(call ? 'listening' : 'idle'); return; }
    speaking = true; setState('speaking'); startMouth();
    let from = 0;
    if (useEleven()) {
      ensureAudio();
      const r = await speakEleven(list, my);
      if (my !== token) return;
      if (r.err) { warn('ElevenLabs: ' + r.err.message + '. Using the free voice.'); from = r.failedAt; }
      else from = list.length;
    }
    if (from < list.length) await speakChrome(list.slice(from), my);
    if (my === token) endSpeak();
  }
  function stopSpeaking(silent) {
    token++; speaking = false; audioOn = false;
    try { curSrc && curSrc.stop(); } catch (_) {}
    speechSynthesis.cancel(); clearInterval(mouthTimer); setMouth('closed');
    if (!silent) setState(call ? 'listening' : 'idle');
  }
  function endSpeak() {
    speaking = false; audioOn = false; clearInterval(mouthTimer); setMouth('closed');
    setTimeout(() => { if (state !== 'speaking') showSub(''); }, 1800);
    setState(call ? 'listening' : 'idle');
  }

  /* ================= VOICE SETTINGS ================= */
  const S = id => sh.querySelector('#' + id);
  function fillVoices() {
    const sel = S('sCv'); sel.textContent = '';
    const o0 = document.createElement('option'); o0.value = ''; o0.textContent = 'Automatic (female)'; sel.appendChild(o0);
    speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)).forEach(v => {
      const o = document.createElement('option'); o.value = v.name; o.textContent = v.name; sel.appendChild(o);
    });
    sel.value = cfg.chromeVoice;
  }
  function fillSettings() {
    S('sEng').value = cfg.engine; S('sKey').value = cfg.key; S('sVid').value = cfg.voiceId;
    S('sMod').value = cfg.model; S('sRate').value = cfg.rate; S('sPitch').value = cfg.pitch; fillVoices();
  }
  function collect() {
    cfg.engine = S('sEng').value; cfg.key = S('sKey').value.trim(); cfg.voiceId = S('sVid').value.trim();
    cfg.model = S('sMod').value; cfg.chromeVoice = S('sCv').value;
    cfg.rate = +S('sRate').value; cfg.pitch = +S('sPitch').value; save();
  }
  function refreshInfo() {
    const m = new Date().toISOString().slice(0, 7);
    S('sInfo').textContent = 'Lucy has sent about ' + (cfg.usedMonth === m ? cfg.used : 0) + ' characters to ElevenLabs this month.';
    if (!cfg.key) return;
    try {
      chrome.runtime.sendMessage({ type: 'sub', key: cfg.key }, r => {
        if (chrome.runtime.lastError || !r || !r.ok) return;
        S('sInfo').textContent = 'ElevenLabs credits used: ' + r.used + ' of ' + r.limit + ' this period.';
      });
    } catch (_) {}
  }
  $('#bVoice').onclick = () => {
    const on = S('set').style.display !== 'block';
    S('set').style.display = on ? 'block' : 'none';
    if (on) { fillSettings(); refreshInfo(); }
  };
  S('sSave').onclick = () => { collect(); S('set').style.display = 'none'; };
  S('sTest').onclick = () => {
    collect(); ensureAudio();
    speak("Hey. I'm Lucy. Is this the voice you wanted?").then(refreshInfo);
  };

  function isEcho(h) {
    const hw = h.toLowerCase().match(/[a-z']+/g) || [];
    if (hw.length < 2) return true;
    const cw = new Set(curChunk.toLowerCase().match(/[a-z']+/g) || []);
    return hw.filter(w => cw.has(w)).length / hw.length > .6;
  }

  /* ================= LISTENING ================= */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function startRec() {
    if (!SR) { showSub('Speech recognition is not available in this browser.'); return; }
    rec = new SR();
    rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = true;
    rec.onresult = e => {
      let fin = '', interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += t; else interim += t;
      }
      onHeard(fin, interim);
    };
    rec.onend = () => { if (call) setTimeout(() => { try { rec.start(); } catch (_) {} }, 250); };
    rec.onerror = e => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        showSub('Microphone is blocked. Click the lock icon in the address bar, allow the microphone, then start the call again.');
        endCall();
      }
    };
    try { rec.start(); } catch (_) {}
  }
  function onHeard(fin, interim) {
    const heard = (fin + ' ' + interim).trim();
    if (!heard || state === 'thinking') return;
    if (state === 'speaking') {
      if (isEcho(heard)) return;
      stopSpeaking();
    }
    if (fin) pending += (pending ? ' ' : '') + fin.trim();
    lastInterim = interim.trim();
    setState('listening');
    showSub('You: ' + (pending + ' ' + lastInterim).trim(), true);
    clearTimeout(sendTimer);
    sendTimer = setTimeout(flush, 3000);
  }
  function flush() {
    const text = (pending + ' ' + lastInterim).trim();
    pending = ''; lastInterim = '';
    if (!text || !call) return;
    sendToChat(text);
  }

  /* ================= TALK TO THE CHAT PAGE ================= */
  function sendToChat(text) {
    const input = getInput();
    if (!input) { showSub('I cannot find the chat box on this page.'); return; }
    setState('thinking');
    showSub('');
    input.focus();
    if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
      const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value').set;
      set.call(input, text);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, text);
    }
    setTimeout(() => {
      const b = qLast(A.send);
      if (b && !b.disabled && b.getAttribute('aria-disabled') !== 'true') b.click();
      else ['keydown', 'keypress', 'keyup'].forEach(t =>
        input.dispatchEvent(new KeyboardEvent(t, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true })));
    }, 450);
  }
  function snapshot() {
    for (const s of A.reply) {
      let n; try { n = document.querySelectorAll(s); } catch (_) { continue; }
      if (n.length) return speechText(n[n.length - 1]);
    }
    return '';
  }
  setInterval(() => {
    if (!call) return;
    const txt = snapshot(), streaming = !!qLast(A.stop);
    if (txt !== lastSig) { lastSig = txt; lastChange = Date.now(); }
    if (state === 'speaking') return;
    const fresh = txt && txt !== lastSpoken;
    if (streaming || (fresh && Date.now() - lastChange < 1800)) {
      if (state !== 'thinking') setState('thinking');
      return;
    }
    if (fresh && txt.length > 1) {
      lastSpoken = txt;
      speak(mode === 'summary' ? summarize(txt) : txt);
      return;
    }
    if (state === 'thinking' && Date.now() - thinkSince > 90000) setState('listening');
  }, 500);

  /* ================= CALL CONTROL ================= */
  function startCall() {
    ensureAudio();
    call = true; lastSpoken = snapshot(); lastSig = lastSpoken;
    bCall.textContent = 'End call'; bCall.classList.add('on'); launch.classList.add('live');
    setState('listening'); showSub('Say something. I am listening.');
    startRec();
  }
  function endCall() {
    call = false; clearTimeout(sendTimer); pending = ''; lastInterim = '';
    try { rec && rec.abort(); } catch (_) {}
    stopSpeaking(true); setState('idle');
    bCall.textContent = 'Start call'; bCall.classList.remove('on'); launch.classList.remove('live');
  }
  bCall.onclick = () => (call ? endCall() : startCall());
})();
