const { createRequire } = require("node:module");

const backendRequire = createRequire(require.resolve("../backend/package.json"));
const mysql = backendRequire("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,

    ssl: {
        rejectUnauthorized: false
    }
});

db.connect((err) => {

    if (err) {
        console.log("Database connection failed:", err.message);
        return;
    }

    console.log("Aiven MySQL connected successfully!");

});

module.exports = db;