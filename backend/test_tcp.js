const net = require('net');

const client = new net.Socket();
client.setTimeout(5000);

client.connect(38845, 'autorack.proxy.rlwy.net', () => {
    console.log('Connected to Railway TCP Proxy!');
    client.destroy(); // kill client after server's response
});

client.on('error', (err) => {
    console.error('Connection Error:', err.message);
});

client.on('timeout', () => {
    console.error('Connection Timeout');
    client.destroy();
});
