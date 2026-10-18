const Database = require('better-sqlite3');
const db = new Database('database.sqlite');


module.exports = db;

database.exec(`
  CREATE TABLE IF NOT EXIST data(
    key INTEGER PRIMARY KEY,
    value TEXT
  ) STRICT
`);

const insert = database.prepare('INSERT INTO data (key, value) VALUES (?, ?)');

insert.run(1, 'ola');
insert.run(2, 'mundo');