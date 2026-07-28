const { readConfig, verifyToken, parseCookie } = require('./_utils');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, message: 'Method not allowed' });
  try {
    const cfg = readConfig();
    const cookies = parseCookie(req.headers.cookie || '');
    const token = cookies.tm_auth;
    const payload = token ? verifyToken(token) : null;
    res.json({ ok: true, config: cfg, authenticated: Boolean(payload) });
  } catch (e) {
    res.status(500).json({ ok: false, message: String(e) });
  }
};
