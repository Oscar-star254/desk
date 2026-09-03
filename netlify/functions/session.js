const { userFromEvent } = require('./_shared/auth');
const { json, preflight } = require('./_shared/http');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  const user = userFromEvent(event);
  if (!user) return json(401, { error: 'Not signed in' });
  return json(200, { user });
};
