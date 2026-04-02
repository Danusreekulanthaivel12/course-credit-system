import fetch from "node-fetch";

async function testFetch() {
    console.log("Sending req...");
    try {
        const res = await fetch("http://localhost:5000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: "admin",
                password: "admin123",
                role: "admin"
            })
        });
        const text = await res.text();
        console.log("Res:", res.status, text);
    } catch(err) {
        console.error("Fetch err:", err);
    }
}
testFetch();
