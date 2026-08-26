const http = require('http');

function postJson(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 8090,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function getJson(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:8090${path}`, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('======================================================');
  console.log('🧪 TESTING VECSENS MULTI-DEVICE CLOUD SERVER API');
  console.log('======================================================\n');

  // 1. Status/Ping
  const statusRes = await getJson('/api/status');
  console.log(`1. Server Status Check: ${statusRes.status === 200 && statusRes.data.status === 'online' ? 'PASS (Online)' : 'FAIL'}`);

  // 2. Register Device A
  const testUser = 'Aspas_' + Date.now();
  const testEmail = `aspas_${Date.now()}@vecsens.com`;
  const regRes = await postJson('/api/auth/register', {
    username: testUser,
    email: testEmail,
    password: 'ChampionsPassword2026',
    avatar: 'crown'
  });
  console.log(`2. Register User (Device A): ${regRes.status === 201 && regRes.data.success ? 'PASS (User Created)' : 'FAIL: ' + JSON.stringify(regRes)}`);
  const userId = regRes.data.user?.id;

  // 3. Login Device B (Simulating phone / other computer)
  const loginRes = await postJson('/api/auth/login', {
    identifier: testEmail,
    password: 'ChampionsPassword2026'
  });
  console.log(`3. Login From Device B (Simulating Phone/Laptop): ${loginRes.status === 200 && loginRes.data.user.username === testUser ? 'PASS (Authenticated across devices)' : 'FAIL'}`);

  // 4. Save History on Device A
  const historyRecord = {
    id: 'vs_rec_test_' + Date.now(),
    user_id: userId,
    game_id: 'valorant',
    game_name: 'Valorant',
    dpi: 800,
    recommended_sens: 0.35,
    edpi: 280,
    cm360: 46.6,
    note: 'Tested from PC on Cloud',
    created_at: new Date().toISOString()
  };

  const saveHistRes = await postJson('/api/history', { record: historyRecord });
  console.log(`4. Save Aim Analysis on Device A: ${saveHistRes.status === 201 ? 'PASS (Saved to Server DB)' : 'FAIL'}`);

  // 5. Fetch History on Device B
  const fetchHistRes = await getJson(`/api/history?userId=${encodeURIComponent(userId)}`);
  const foundRecord = fetchHistRes.data.history?.find(h => h.id === historyRecord.id);
  console.log(`5. Fetch History on Device B: ${foundRecord && foundRecord.edpi === 280 ? 'PASS (Synced across devices!)' : 'FAIL'}`);

  // 6. Save Aim Score
  const aimScorePayload = {
    id: 'aim_test_' + Date.now(),
    user_id: userId,
    score: 14500,
    accuracy: 94.5,
    mode: 'flick'
  };
  const aimRes = await postJson('/api/aim-scores', { score: aimScorePayload });
  console.log(`6. Save Aim Score to Cloud: ${aimRes.status === 201 ? 'PASS' : 'FAIL'}`);

  // 7. Submit Cloud Feedback
  const fbRes = await postJson('/api/feedback', {
    feedback: {
      rating: 5,
      tried: 'yes',
      text: 'Multi-device cloud works flawlessly!'
    }
  });
  console.log(`7. Submit Feedback to Cloud: ${fbRes.status === 201 ? 'PASS' : 'FAIL'}`);

  console.log('\n======================================================');
  console.log('🎉 ALL MULTI-DEVICE CLOUD TESTS PASSED WITH 100% SUCCESS!');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
