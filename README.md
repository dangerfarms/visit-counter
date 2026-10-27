# Visit counter

A small web service that counts its visits in Postgres. It reads the database from `DATABASE_URL`, makes its one
table the first time it starts, and answers on `PORT` (8080 by default).

- `/` shows the count (send `Accept: application/json` for `{"count": n}`)
- `/health` answers `ok`

Run it locally with `DATABASE_URL=postgres://… npm start`.
