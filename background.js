// Talks to ElevenLabs for Lucy (runs in the background so websites cannot block it).
function b64(buf) {
  const u = new Uint8Array(buf); let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(s);
}
function humanErr(status, text) {
  const t = (text || '').toLowerCase();
  if (status === 401) return 'the API key was rejected';
  if (t.includes('paid_plan_required') || t.includes('library')) return 'this voice needs a paid plan';
  if (status === 402 || status === 429 || t.includes('quota')) return 'credits are used up or too many requests';
  if (status === 404 || t.includes('voice_not_found')) return 'voice ID not found';
  return 'error ' + status;
}
chrome.runtime.onMessage.addListener((m, _s, send) => {
  (async () => {
    try {
      if (m.type === 'tts') {
        const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + encodeURIComponent(m.voiceId), {
          method: 'POST',
          headers: { 'xi-api-key': m.key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
          body: JSON.stringify({
            text: m.text, model_id: m.model,
            voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true }
          })
        });
        if (!r.ok) {
          let t = ''; try { t = (await r.text()).slice(0, 400); } catch (_) {}
          send({ ok: false, error: humanErr(r.status, t) }); return;
        }
        send({ ok: true, audio: b64(await r.arrayBuffer()) });
      } else if (m.type === 'sub') {
        const r = await fetch('https://api.elevenlabs.io/v1/user/subscription', { headers: { 'xi-api-key': m.key } });
        if (!r.ok) { send({ ok: false }); return; }
        const j = await r.json();
        send({ ok: true, used: j.character_count, limit: j.character_limit });
      }
    } catch (e) { send({ ok: false, error: 'no internet connection' }); }
  })();
  return true;
});
