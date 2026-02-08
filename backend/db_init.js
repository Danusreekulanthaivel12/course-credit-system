import mysql from "mysql2";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
    host: "localhost",
    user: "root",
    password: "DanuK@05",
    multipleStatements: true // Critical for running schema.sql
};

const initDB = () => {
    const connection = mysql.createConnection(dbConfig);

    const schemaPath = path.join(__dirname, "../database/schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    connection.connect(err => {
        if (err) {
            console.error("Error connecting to MySQL server:", err);
            return;
        }
        console.log("Connected to MySQL server.");

        connection.query(schemaSql, (err, results) => {
            if (err) {
                console.error("Error executing schema.sql:", err);
            } else {
                console.log("Database initialized successfully!");
            }
            connection.end();
        });
    });
};

initDB();
