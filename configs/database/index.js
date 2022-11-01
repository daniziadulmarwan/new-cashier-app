const sqlite = require("sqlite3").verbose();
const db = new sqlite.Database("./System/db/cashier.db");
module.exports = db;
