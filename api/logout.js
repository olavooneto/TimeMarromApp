module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });
  // Clear cookie
  const cookie = `tm_auth=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax` + (process.env.NODE_ENV === 'production' ? '; Secure' : '');
  res.setHeader('Set-Cookie', cookie);
  res.json({ ok: true });
};
