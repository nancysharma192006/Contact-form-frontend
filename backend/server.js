require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "ReachOut API is running"
    });
});

app.get("/api/db", (req, res) => {
    db.query("SELECT 1", (err) => {
        if (err) {
            console.error("Database check failed:", err.message);
            return res.status(500).json({
                success: false,
                message: "Database check failed"
            });
        }

        res.json({
            success: true,
            message: "Backend and database are connected"
        });
    });
});

app.get("/api/contacts", (req, res) => {

    db.query("SELECT * FROM contacts", (err, results) => {

        if (err) {
            console.error("Failed to load contacts:", err.message);
            return res.status(500).json({
                success: false,
                message: "Failed to load contacts"
            });
        }

        res.json({
            success: true,
            contacts: results
        });
    });
});

app.post("/api/contact", (req, res) => {

    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    const sql = `
        INSERT INTO contacts (name, email, message)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [name, email, message], (err, result) => {

        if (err) {
            console.log(err);

            return res.status(500).json({
                success: false,
                message: "Failed to save message"
            });
        }

        res.status(201).json({
            success: true,
            message: "Message saved successfully",
            id: result.insertId
        });
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`ReachOut backend running on port ${PORT}`);
});