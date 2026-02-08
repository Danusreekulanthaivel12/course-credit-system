const http = require('http');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000';
const LOG_FILE = 'test_output.txt';

function log(msg) {
    fs.appendFileSync(LOG_FILE, msg + '\n');
    console.log(msg);
}

// Clear log file
if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);

function request(endpoint, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + endpoint);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    log("Failed to parse JSON: " + data);
                    resolve({ status: res.statusCode, data: null });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    log("Starting Tests (Debug Response Mode)...");

    try {
        // 1. Admin Login
        let res = await request('/login', 'POST', { username: 'admin', password: 'admin123', role: 'admin' });
        if (res.data && res.data.success) log("✅ Admin Login Success");
        else throw new Error("Admin Login Failed");

        // 2. Add Department
        const deptName = `DebugResDept_${Date.now()}`;
        res = await request('/departments', 'POST', { name: deptName });
        const deptId = res.data.id;
        log(`✅ Department '${deptName}' Added (ID: ${deptId})`);

        // 3. Add Courses
        const courses = [
            { code: `R_CS1_${Date.now()}`, name: "Intro to Res", credits: 10, type: 'Regular' },
        ];

        for (const c of courses) {
            res = await request('/courses', 'POST', {
                course_code: c.code,
                course_name: c.name,
                credits: c.credits,
                dept_id: deptId,
                semester: 1,
                type: c.type
            });
            log(`- Added ${c.code}: ${res.status}`);
            if (res.status !== 200) {
                log(`  ❌ ERROR: ${JSON.stringify(res.data)}`);
            }
        }

    } catch (err) {
        log("Test Error: " + err.message);
    }
}

runTests();
