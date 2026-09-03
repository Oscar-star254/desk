const { getSql } = require('./_shared/db');
const { userFromEvent } = require('./_shared/auth');
const { json, preflight } = require('./_shared/http');

const ALLOWED_APPS = ['planner', 'ledger', 'income', 'advanced', 'academics'];

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const user = userFromEvent(event);
  if (!user) return json(401, { error: 'Not signed in' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { error: 'Invalid JSON body' });
  }

  const app = body.app;
  const data = body.data;
  if (ALLOWED_APPS.indexOf(app) === -1) return json(400, { error: 'Unknown app: ' + app });
  if (typeof data !== 'object' || data === null) return json(400, { error: 'data must be an object' });

  const sql = getSql();
  try {
    await sql`
      INSERT INTO desk_data (user_id, app, data, updated_at)
      VALUES (${user.id}, ${app}, ${JSON.stringify(data)}::jsonb, now())
      ON CONFLICT (user_id, app)
      DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at
    `;
    return json(200, { error: null });
  } catch (e) {
    return json(500, { error: 'Could not save data. ' + (e.message || '') });
  }
};
