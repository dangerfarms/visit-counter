// A web page that counts its visits in Postgres. The database is the one DATABASE_URL names.
import http from 'node:http';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
await pool.query('CREATE TABLE IF NOT EXISTS visits (id bigserial PRIMARY KEY, at timestamptz NOT NULL DEFAULT now())');

const page = (count, last) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Visit counter</title>
<style>
  :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: light-dark(#f6f5f1, #141412); color: light-dark(#1d1d1b, #ecebe6); }
  main { text-align: center; }
  .count { font-size: clamp(4rem, 18vw, 10rem); font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
  p { opacity: .7; }
</style></head>
<body><main>
  <div class="count">${count}</div>
  <p>visits, counted in Postgres${last ? ` · the one before you came at ${last}` : ''}</p>
</main></body></html>`;

http.createServer(async (req, res) => {
  try {
    if (req.url === '/health') return res.end('ok');
    if (req.url !== '/') { res.statusCode = 404; return res.end('Not found'); }
    const before = await pool.query('SELECT at FROM visits ORDER BY id DESC LIMIT 1');
    await pool.query('INSERT INTO visits DEFAULT VALUES');
    const { rows: [{ count }] } = await pool.query('SELECT count(*)::int AS count FROM visits');
    const last = before.rows[0]?.at?.toISOString().replace('T', ' ').slice(0, 19);
    if ((req.headers.accept ?? '').includes('application/json')) {
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify({ count }));
    }
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.end(page(count, last && `${last} UTC`));
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end('The database could not be reached.');
  }
}).listen(Number(process.env.PORT ?? 8080));
