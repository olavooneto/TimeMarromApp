const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || 'de4f08d7e9720fe25b5fe8a792394d3b9232a20031a1fe465a7fca822361e566';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret';

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
            out[section][field] = String(Math.round(n));
          } else {
            out[section][field] = String(val).replace(/[\u0000-\u001f]/g, '').trim();
          }
        }
      }
    }
  }

  return out;
}

function readConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function writeConfig(obj) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(obj, null, 2), 'utf8');
}

function verifyPassword(password) {
  return sha256Hex(password) === ADMIN_PASSWORD_HASH;
}

function signToken(payload) {
  return jwt.sign(payload, SESSION_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SESSION_SECRET, { algorithms: ['HS256'] });
  } catch (e) {
    return null;
  }
}

function parseCookie(header) {
  if (!header) return {};
  return header.split(';').map(s=>s.trim()).reduce((acc, pair)=>{
    const idx = pair.indexOf('=');
    if (idx<0) return acc;
    const k = pair.slice(0,idx);
    const v = pair.slice(idx+1);
    acc[k]=v;return acc;
  },{});
}

module.exports = {
  validateConfig,
  sanitizeConfig,
  readConfig,
  writeConfig,
  verifyPassword,
  signToken,
  verifyToken,
  parseCookie,
  ADMIN_EMAIL
};
