import mysql from "mysql2";
import fs from "fs";

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "DanuK@05",
    database: "course_credit_system"
});

db.connect(err => {
    if (err) return console.error(err);
    db.query("DESCRIBE registrations", (err, res) => {
        if (err) console.error(err);
        else fs.writeFileSync("schema_output.json", JSON.stringify(res, null, 2));
        db.end();
    });
});
