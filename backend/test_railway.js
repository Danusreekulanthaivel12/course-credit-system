import mysql from 'mysql2';

const dbUrl = 'mysql://root:XqWboWFUqvZgCsyHExuYTpYXeVZwyrmR@autorack.proxy.rlwy.net:38845/railway';

const db = mysql.createConnection(dbUrl);

console.log("Testing connection to Railway DB...");

db.connect((err) => {
    if (err) {
        console.error("Connection Failed:", err);
    } else {
        console.log("Connection Successful!");
        db.query("SHOW TABLES", (err, result) => {
            if (err) {
                console.error("Error running query:", err);
            } else {
                console.log("Tables in database:", result);
            }
            db.end();
        });
    }
});
