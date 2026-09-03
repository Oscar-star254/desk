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
  if (!email || !password) return json(400, { error: 'Email and password are required.' });

  const sql = getSql();
  try {
    const rows = await sql`SELECT id, email, password_hash FROM users WHERE email = ${email}`;
    const user = rows[0];
    if (!user) return json(401, { error: 'Incorrect email or password.' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return json(401, { error: 'Incorrect email or password.' });

    const token = signToken(user);
    return json(200, { token, user: { id: user.id, email: user.email } });
  } catch (e) {
    return json(500, { error: 'Sign in failed. ' + (e.message || '') });
  }
};
