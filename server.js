const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const SUBSCRIBERS_FILE = path.join(__dirname, 'data', 'abonnees.json');

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readSubscribers() {
  try {
    return JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function handleNewsletterSignup(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; if (body.length > 10_000) req.destroy(); });
  req.on('end', () => {
    let email;
    try {
      email = JSON.parse(body).email;
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Ongeldig verzoek.' }));
      return;
    }

    if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Vul een geldig e-mailadres in.' }));
      return;
    }

    const subscribers = readSubscribers();
    if (!subscribers.some(s => s.email.toLowerCase() === email.toLowerCase())) {
      subscribers.push({ email, aangemeld_op: new Date().toISOString() });
      fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  });
}

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/nieuwsbrief') {
    handleNewsletterSignup(req, res);
    return;
  }

  const urlPath = req.url.split('?')[0];
  let filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);
  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`AgressieVisie draait op http://localhost:${PORT}`);
});
