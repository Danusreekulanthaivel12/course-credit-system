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
    database: "course_credit_system",
    multipleStatements: true
};

const resetDB = () => {
    const connection = mysql.createConnection(dbConfig);

    const schemaPath = path.join(__dirname, "../database/schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    const dropSql = `
    DROP TABLE IF EXISTS registrations;
    DROP TABLE IF EXISTS courses;
    DROP TABLE IF EXISTS students;
    DROP TABLE IF EXISTS departments;
    DROP TABLE IF EXISTS admins;
  `;

    connection.connect(err => {
        if (err) {
            console.error("Error connecting to MySQL:", err);
            return;
        }
        console.log("Connected to MySQL.");

        // 1. Drop Tables
        connection.query(dropSql, (err) => {
            if (err) {
                console.error("Error dropping tables:", err);
                process.exit(1);
            }
            console.log("Tables dropped.");

            // 2. Run Schema
            connection.query(schemaSql, (err) => {
                if (err) {
                    console.error("Error executing schema.sql:", err);
                } else {
                    console.log("Database initialized successfully!");
                }
                connection.end();
                process.exit(0);
            });
        });
    });
};

resetDB();
