const jwt = require('jsonwebtoken');

function getSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set.');
  }
  return process.env.JWT_SECRET;
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, getSecret(), { expiresIn: '30d' });
}

// Returns { id, email } from a valid Bearer token, or null.
function userFromEvent(event) {
  const header = event.headers && (event.headers.authorization || event.headers.Authorization);
  if (!header || header.indexOf('Bearer ') !== 0) return null;
  const token = header.slice(7).trim();
  try {
    const payload = jwt.verify(token, getSecret());
    return { id: payload.sub, email: payload.email };
  } catch (e) {
    return null;
  }
}

module.exports = { signToken, userFromEvent };
