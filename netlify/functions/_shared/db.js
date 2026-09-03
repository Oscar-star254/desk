// Thin wrapper around Neon's serverless Postgres driver.
// Works great in Netlify Functions (AWS Lambda) since it talks to
// Postgres over HTTP/WebSocket instead of a long-lived TCP connection,
// so there's no connection-pool exhaustion between invocations.
const { neon } = require('@neondatabase/serverless');

let sql;
function getSql() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set.');
    }
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

module.exports = { getSql };
