const { getSql } = require('./_shared/db');
const { userFromEvent } = require('./_shared/auth');
const { json, preflight } = require('./_shared/http');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

  const user = userFromEvent(event);
  if (!user) return json(401, { error: 'Not signed in' });

  const sql = getSql();
  try {
    const rows = await sql`SELECT app, data FROM desk_data WHERE user_id = ${user.id}`;
    return json(200, { data: rows, error: null });
  } catch (e) {
    return json(500, { error: 'Could not load data. ' + (e.message || '') });
  }
};
