const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const CONFIG_PATH = path.join(__dirname, 'config.json');

// Provided SHA-256 hash (user supplied)
const ADMIN_PASSWORD_HASH = 'e4aa82ff0f4e6f35384c9696180c1eabba2279102dc1bf4077fe00f127604ae8';
// Optional: set ADMIN_EMAIL env var to restrict login to a specific email
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 }
}));

// Serve static site
app.use(express.static(path.join(__dirname)));

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function toNumberish(v) {
  if (v === null || v === undefined) return NaN;
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
  if (typeof v === 'string') {
    const cleaned = v.replace(/[^0-9.,\-]/g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
}

function validateConfig(obj) {
  const errors = [];
  if (!obj || typeof obj !== 'object') {
    errors.push('config must be an object');
    return { ok: false, errors };
  }

  const required = {
    cestometro: ['totalDeCestas', 'totalArrecadadas'],
    bazometro: ['totalDeRoupas', 'totalArrecadadas'],
    doacoesSangue: ['totalNaIgreja', 'totalForaIgreja', 'totalMetaDeDoacoes'],
    suaNfTemValor: ['totalDeNfACadastrar', 'totalDeDoacoes']
  };

  for (const section of Object.keys(required)) {
    if (!obj[section] || typeof obj[section] !== 'object') {
      errors.push(`missing or invalid section: ${section}`);
      continue;
    }
    for (const field of required[section]) {
      if (!(field in obj[section])) {
        errors.push(`missing field ${section}.${field}`);
        continue;
      }
      const v = obj[section][field];
      const n = toNumberish(v);
      if (Number.isNaN(n)) {
        errors.push(`field ${section}.${field} must be numeric (got '${String(v)}')`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

function sanitizeConfig(obj) {
  const out = {};
  const sections = {
    cestometro: ['totalDeCestas', 'totalArrecadadas', 'ultimaAtualizacao'],
    bazometro: ['totalDeRoupas', 'totalArrecadadas', 'ultimaAtualizacao'],
    doacoesSangue: ['totalNaIgreja', 'totalForaIgreja', 'totalMetaDeDoacoes', 'ultimaAtualizacao'],
    suaNfTemValor: ['totalDeNfACadastrar', 'totalDeDoacoes', 'ultimaAtualizacao']
  };

  for (const section of Object.keys(sections)) {
    out[section] = {};
    const src = (obj && obj[section]) || {};
    for (const field of sections[section]) {
      if (field in src) {
        const val = src[field];
        if (field === 'ultimaAtualizacao') {
          let s = String(val || '').trim();
          if (s.length > 64) s = s.slice(0, 64);
          out[section][field] = s;
        } else {
          const n = toNumberish(val);
          if (!Number.isNaN(n)) {
            // store as integer-like string
            out[section][field] = String(Math.round(n));
          } else {
            // fallback: trimmed string (avoid control characters)
            out[section][field] = String(val).replace(/[\u0000-\u001f]/g, '').trim();
          }
        }
      }
    }
  }

  return out;
}

function isAuthenticated(req) {
  return req.session && req.session.authenticated;
}

app.get('/control', (req, res) => {
  res.sendFile(path.join(__dirname, 'control.html'));
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!password) return res.status(400).json({ ok: false, message: 'Missing password' });

  const h = sha256Hex(password);
  if (h !== ADMIN_PASSWORD_HASH) return res.status(401).json({ ok: false, message: 'Invalid credentials' });
  if (ADMIN_EMAIL && String(email || '').toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(401).json({ ok: false, message: 'Invalid email' });
  }

  req.session.authenticated = true;
  req.session.user = { email: email || 'admin' };
  res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/config', (req, res) => {
  fs.readFile(CONFIG_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ ok: false, message: 'Failed to read config' });
    try {
      const json = JSON.parse(data);
      res.json({ ok: true, config: json, authenticated: isAuthenticated(req) });
    } catch (e) {
      res.status(500).json({ ok: false, message: 'Invalid JSON in config' });
    }
  });
});

app.post('/api/save', (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ ok: false, message: 'Not authenticated' });
  const newConfig = req.body && req.body.config;
  if (!newConfig) return res.status(400).json({ ok: false, message: 'Missing config' });

  // basic validation: must be an object
  if (typeof newConfig !== 'object') return res.status(400).json({ ok: false, message: 'Config must be an object' });

  // run structured validation and return detailed errors
  try {
    const v = validateConfig(newConfig);
    if (!v.ok) return res.status(400).json({ ok: false, message: 'Validation failed', errors: v.errors });
  } catch (e) {
    return res.status(400).json({ ok: false, message: 'Validation error', error: String(e) });
  }

  // sanitize the config (normalize numeric-ish fields and trim text)
  const safeConfig = sanitizeConfig(newConfig);

  fs.writeFile(CONFIG_PATH, JSON.stringify(safeConfig, null, 2), 'utf8', (err) => {
    if (err) return res.status(500).json({ ok: false, message: 'Failed to write config' });
    res.json({ ok: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  console.log('Control page: http://localhost:%s/control', PORT);
});
