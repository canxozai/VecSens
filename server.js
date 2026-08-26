const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8090;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'vecsens_db.json');

// Ensure data directory and db file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getInitialDb() {
  return {
    users: [],
    history: [],
    aim_scores: [],
    feedbacks: [],
    config: {
      cloudProvider: 'VecSens Global Cloud Server',
      version: '2.0-esports'
    }
  };
}

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDb();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading database file, resetting to initial:', e);
    return getInitialDb();
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Error writing database file:', e);
    return false;
  }
}

function hashPassword(pwd) {
  return crypto.createHash('sha256').update(pwd + '_vecsens_fps_vault_2026').digest('hex');
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS, PUT',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache'
  });
  res.end(JSON.stringify(payload));
}

function parseJsonBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
    if (body.length > 5 * 1024 * 1024) { // 5MB limit
      req.destroy();
    }
  });
  req.on('end', () => {
    try {
      const parsed = body ? JSON.parse(body) : {};
      callback(null, parsed);
    } catch (err) {
      callback(err);
    }
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS, PUT',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }

  // ════════════════════════════════════════════════════════════
  //  API ENDPOINTS (VECSENS CLOUD VAULT REST API)
  // ════════════════════════════════════════════════════════════

  // 1. Health & Ping
  if (pathname === '/api/status' || pathname === '/api/ping') {
    const db = readDb();
    sendJson(res, 200, {
      status: 'online',
      provider: 'VecSens Cloud Vault',
      timestamp: Date.now(),
      totalUsers: db.users.length,
      totalRecords: db.history.length
    });
    return;
  }

  // 2. Auth: Register
  if (pathname === '/api/auth/register' && method === 'POST') {
    parseJsonBody(req, (err, body) => {
      if (err || !body.username || !body.email || !body.password) {
        sendJson(res, 400, { error: 'Geçersiz kayıt bilgileri' });
        return;
      }
      const db = readDb();
      const emailLower = body.email.trim().toLowerCase();
      const userLower = body.username.trim().toLowerCase();

      if (db.users.find(u => u.email.toLowerCase() === emailLower)) {
        sendJson(res, 409, { error: 'Bu e-posta adresi zaten kayıtlı!' });
        return;
      }
      if (db.users.find(u => u.username.toLowerCase() === userLower)) {
        sendJson(res, 409, { error: 'Bu kullanıcı adı zaten kullanımda!' });
        return;
      }

      const newUser = {
        id: 'vs_usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        username: body.username.trim(),
        email: body.email.trim(),
        passwordHash: hashPassword(body.password),
        avatar: body.avatar || 'crosshair',
        createdAt: new Date().toISOString(),
        isCloud: true
      };

      db.users.push(newUser);
      writeDb(db);

      // Return user without passwordHash
      const { passwordHash, ...userClean } = newUser;
      sendJson(res, 201, { success: true, user: userClean });
    });
    return;
  }

  // 3. Auth: Login
  if (pathname === '/api/auth/login' && method === 'POST') {
    parseJsonBody(req, (err, body) => {
      if (err || !body.identifier || !body.password) {
        sendJson(res, 400, { error: 'Lütfen kullanıcı adı/e-posta ve şifrenizi girin' });
        return;
      }
      const db = readDb();
      const idLower = body.identifier.trim().toLowerCase();
      const user = db.users.find(u => u.email.toLowerCase() === idLower || u.username.toLowerCase() === idLower);

      if (!user) {
        sendJson(res, 404, { error: 'Hesap bulunamadı. Lütfen kayıt olun.' });
        return;
      }

      const inputHash = hashPassword(body.password);
      if (user.passwordHash === inputHash || user.password === body.password) {
        const { passwordHash, ...userClean } = user;
        sendJson(res, 200, { success: true, user: userClean });
      } else {
        sendJson(res, 401, { error: 'Hatalı şifre!' });
      }
    });
    return;
  }

  // 4. Auth: Update Profile
  if (pathname === '/api/auth/profile' && method === 'POST') {
    parseJsonBody(req, (err, body) => {
      if (err || !body.userId) {
        sendJson(res, 400, { error: 'Kullanıcı ID gerekli' });
        return;
      }
      const db = readDb();
      const userIdx = db.users.findIndex(u => u.id === body.userId);
      if (userIdx === -1) {
        sendJson(res, 404, { error: 'Kullanıcı bulunamadı' });
        return;
      }

      if (body.username) db.users[userIdx].username = body.username.trim();
      if (body.avatar) db.users[userIdx].avatar = body.avatar;
      writeDb(db);

      const { passwordHash, ...userClean } = db.users[userIdx];
      sendJson(res, 200, { success: true, user: userClean });
    });
    return;
  }

  // 5. History: Get User History
  if (pathname === '/api/history' && method === 'GET') {
    const userId = parsedUrl.searchParams.get('userId');
    const db = readDb();
    const records = db.history.filter(h => h.user_id === userId);
    sendJson(res, 200, { success: true, history: records });
    return;
  }

  // 6. History: Save Analysis Record
  if (pathname === '/api/history' && method === 'POST') {
    parseJsonBody(req, (err, body) => {
      if (err || !body.record) {
        sendJson(res, 400, { error: 'Geçersiz kayıt verisi' });
        return;
      }
      const db = readDb();
      const rec = body.record;
      // Prevent duplicates by ID
      const existingIdx = db.history.findIndex(h => h.id === rec.id);
      if (existingIdx !== -1) {
        db.history[existingIdx] = rec;
      } else {
        db.history.unshift(rec);
      }
      writeDb(db);
      sendJson(res, 201, { success: true, record: rec });
    });
    return;
  }

  // 7. History: Delete Record
  if (pathname === '/api/history' && method === 'DELETE') {
    const id = parsedUrl.searchParams.get('id');
    const userId = parsedUrl.searchParams.get('userId');
    const db = readDb();

    if (id) {
      db.history = db.history.filter(h => h.id !== id);
    } else if (userId) {
      db.history = db.history.filter(h => h.user_id !== userId);
    }
    writeDb(db);
    sendJson(res, 200, { success: true, message: 'Silindi' });
    return;
  }

  // 8. Aim Scores: Save & Get
  if (pathname === '/api/aim-scores' && method === 'GET') {
    const userId = parsedUrl.searchParams.get('userId');
    const db = readDb();
    const scores = db.aim_scores.filter(s => s.user_id === userId);
    sendJson(res, 200, { success: true, scores });
    return;
  }

  if (pathname === '/api/aim-scores' && method === 'POST') {
    parseJsonBody(req, (err, body) => {
      if (err || !body.score) {
        sendJson(res, 400, { error: 'Geçersiz skor verisi' });
        return;
      }
      const db = readDb();
      db.aim_scores.unshift(body.score);
      writeDb(db);
      sendJson(res, 201, { success: true });
    });
    return;
  }

  // 9. Feedback
  if (pathname === '/api/feedback' && method === 'POST') {
    parseJsonBody(req, (err, body) => {
      if (err || !body.feedback) {
        sendJson(res, 400, { error: 'Geçersiz geri bildirim verisi' });
        return;
      }
      const db = readDb();
      db.feedbacks.unshift(body.feedback);
      writeDb(db);
      sendJson(res, 201, { success: true });
    });
    return;
  }

  // ════════════════════════════════════════════════════════════
  //  STATIC FILE SERVING
  // ════════════════════════════════════════════════════════════
  let reqUrl = pathname;
  if (reqUrl === '/') reqUrl = '/index.html';
  const filePath = path.join(__dirname, reqUrl);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 VecSens Pro Cloud Vault Server running!`);
  console.log(`🌐 Local Access:    http://localhost:${PORT}`);
  console.log(`📱 Network Access:  http://0.0.0.0:${PORT}`);
  console.log(`🗄️ Database File:   ${DB_FILE}`);
  console.log(`====================================================`);
});
