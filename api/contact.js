const submissions = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

function send(res, status, payload) { res.status(status).json(payload); }
function clean(value, max) { return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : ''; }

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  if (body.website) return send(res, 200, { ok: true });
  const name = clean(body.name, 100), email = clean(body.email, 254).toLowerCase();
  const subject = clean(body.subject, 160), message = clean(body.message, 5_000);
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || subject.length < 3 || message.length < 10) {
    return send(res, 400, { error: 'Please provide a valid name, email, subject, and message.' });
  }
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now(), attempts = (submissions.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (attempts.length >= MAX_REQUESTS) return send(res, 429, { error: 'Please wait a minute before sending another message.' });
  attempts.push(now); submissions.set(ip, attempts);
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) return send(res, 503, { error: 'Messaging is being configured. Please email me directly for now.' });
  try {
    const upstream = await fetch(`${url.replace(/\/$/, '')}/rest/v1/contact_messages`, {
      method: 'POST', headers: { apikey: secret, Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ name, email, subject, message, source: 'portfolio' })
    });
    if (!upstream.ok) { console.error('Supabase insert failed:', upstream.status, await upstream.text()); return send(res, 502, { error: 'Unable to save your message right now. Please try again shortly.' }); }
    return send(res, 201, { ok: true, message: 'Message received. Thank you — I’ll reply soon.' });
  } catch (error) { console.error('Contact function error:', error); return send(res, 502, { error: 'Unable to reach the message service. Please try again shortly.' }); }
};
