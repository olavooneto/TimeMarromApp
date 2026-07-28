const { verifyPassword, signToken, ADMIN_EMAIL } = require('./_utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });
  try {
    const body = req.body || {};
    const { email, password } = body;
    if (!password) return res.status(400).json({ ok: false, message: 'Missing password' });
    if (!verifyPassword(password)) return res.status(401).json({ ok: false, message: 'Invalid credentials' });
    if (ADMIN_EMAIL && String(email||'').toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return res.status(401).json({ ok: false, message: 'Invalid email' });
    }

    const token = signToken({ email: email || 'admin' });
    const cookie = `tm_auth=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax` + (process.env.NODE_ENV === 'production' ? '; Secure' : '');
    res.setHeader('Set-Cookie', cookie);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, message: String(e) });
  }
};
