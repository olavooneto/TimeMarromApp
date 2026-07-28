const { readConfig, writeConfig, verifyToken, parseCookie, validateConfig, sanitizeConfig } = require('./_utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });
  try {
    const cookies = parseCookie(req.headers.cookie || '');
    const token = cookies.tm_auth;
    const payload = token ? verifyToken(token) : null;
    if (!payload) return res.status(401).json({ ok: false, message: 'Not authenticated' });

    const newConfig = req.body && req.body.config;
    if (!newConfig) return res.status(400).json({ ok: false, message: 'Missing config' });
    if (typeof newConfig !== 'object') return res.status(400).json({ ok: false, message: 'Config must be an object' });

    const v = validateConfig(newConfig);
    if (!v.ok) return res.status(400).json({ ok: false, message: 'Validation failed', errors: v.errors });

    const safe = sanitizeConfig(newConfig);
    writeConfig(safe);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: String(e) });
  }
};
