/** DB access module **/

import sqlite3 from "sqlite3";

const db = new sqlite3.Database('GM.db', (err) => {
    if (err) throw err;
});

export default db;