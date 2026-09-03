const bcrypt = require('bcryptjs');
const { getSql } = require('./_shared/db');
const { signToken } = require('./_shared/auth');
const { json, preflight } = require('./_shared/http');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { error: 'Invalid JSON body' });
  }

  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return json(400, { error: 'Enter a valid email address.' });
  if (!password || password.length < 8) return json(400, { error: 'Password must be at least 8 characters.' });

  const sql = getSql();
  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length) return json(409, { error: 'An account with that email already exists.' });

    const hash = await bcrypt.hash(password, 10);
    const rows = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${hash})
      RETURNING id, email
    `;
    const user = rows[0];
    const token = signToken(user);
    return json(200, { token, user });
  } catch (e) {
    return json(500, { error: 'Could not create account. ' + (e.message || '') });
  }
};
