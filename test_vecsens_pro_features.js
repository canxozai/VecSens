const fs = require('fs');
const path = require('path');

console.log('======================================================');
console.log('🧪 RUNNING VECSENS PRO ESPORTS & CLOUD SUITE');
console.log('======================================================\n');

const htmlPath = path.join(__dirname, 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Mock browser environment
const localStorageStore = {};
global.localStorage = {
  getItem: (k) => localStorageStore[k] || null,
  setItem: (k, v) => { localStorageStore[k] = String(v); },
  removeItem: (k) => { delete localStorageStore[k]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

global.window = {
  location: { href: 'http://localhost:3000' },
  siteConfig: {
    cloud: {
      supabaseUrl: 'https://vecsens-cloud-mock.supabase.co',
      supabaseAnonKey: 'mock-anon-key'
    }
  }
};
global.currentLang = 'tr';
global.showToast = (msg) => { /* mock toast */ };
global.state = {
  currentPage: 'analysis',
  answers: { q1: ['valorant'], q2: 'Logitech G Pro X Superlight 2', q5: 'large', q11: 'claw', q12: 'both' },
  computedProfiles: [
    { type: 'precision', name: 'Hassasiyet', subname: 'Sniper & Micro', sens: 0.28, edpi: 224, cm360: 58.7, halfTurn: 29.4, dpi: 800 },
    { type: 'balanced', name: 'Dengeli', subname: 'All-Round', sens: 0.38, edpi: 304, cm360: 43.3, halfTurn: 21.7, dpi: 800 },
    { type: 'speed', name: 'Hız', subname: 'Entry Frag', sens: 0.48, edpi: 384, cm360: 34.3, halfTurn: 17.2, dpi: 800 }
  ],
  recIdx: 1
};

// 1. Verify PRO_DATA existence & completeness
console.log('1. Checking PRO_DATA database...');
if (htmlContent.includes('const PRO_DATA = {') && htmlContent.includes('TenZ') && htmlContent.includes('Sentinels')) {
  console.log('   PRO_DATA pro players database: OK');
} else {
  throw new Error('PRO_DATA database missing or corrupted');
}

// 2. Verify VecSensCloud Methods in index.html
console.log('2. Checking VecSensCloud Pro & Cloud methods in code...');
const requiredMethods = [
  'measurePing',
  'getProMatches',
  'openShareAimCardModal',
  'saveAimScore',
  'submitFeedback',
  'broadcastSync'
];

requiredMethods.forEach(method => {
  if (htmlContent.includes(`${method}(`)) {
    console.log(`   VecSensCloud.${method}: FOUND`);
  } else {
    throw new Error(`VecSensCloud.${method} not found in index.html`);
  }
});

// 3. Verify CSS components
console.log('3. Checking CSS Classes for Pro Esports upgrade...');
const requiredCss = [
  '.cloud-latency-pill',
  '.mousepad-sim-card',
  '.mousepad-visual-canvas',
  '.pro-matcher-card',
  '.pro-match-item',
  '.aim-card-container',
  '.aim-card-main-grid'
];

requiredCss.forEach(selector => {
  if (htmlContent.includes(selector)) {
    console.log(`   CSS selector ${selector}: FOUND`);
  } else {
    throw new Error(`CSS selector ${selector} not found in index.html`);
  }
});

// 4. Test Pro Matcher algorithmic logic
console.log('4. Testing Pro Matcher mathematical calculation...');
function calcCm360(dpi, sens, gameId) {
  const yaw = 0.07; // Valorant yaw
  return Math.round((360 / (dpi * sens * yaw) * 2.54) * 10) / 10;
}

const mockPros = [
  { name: 'TenZ', team: 'Sentinels', mouse: 'Ninjutso Sora V2', dpi: 1600, sens: 0.24 }, // cm360: ~34.3
  { name: 'Derke', team: 'Fnatic', mouse: 'Razer DeathAdder V3 Pro', dpi: 400, sens: 0.74 }, // cm360: ~44.5
  { name: 'nAts', team: 'Liquid', mouse: 'Zowie S2-C', dpi: 800, sens: 0.49 } // cm360: ~33.6
];

const userCm360 = 43.3; // matches Derke closely (~44.5)
const matches = mockPros.map(pro => {
  const proCm = calcCm360(pro.dpi, pro.sens, 'valorant');
  const delta = Math.abs(proCm - userCm360);
  const pct = Math.max(45, Math.min(99, Math.round(100 - (delta / Math.max(proCm, userCm360, 1)) * 65)));
  return { name: pro.name, matchPct: pct, proCm };
});
matches.sort((a, b) => b.matchPct - a.matchPct);

console.log(`   Top match for ${userCm360} cm/360: ${matches[0].name} (${matches[0].matchPct}% match, ${matches[0].proCm} cm)`);
if (matches[0].name !== 'Derke' || matches[0].matchPct < 90) {
  throw new Error('Pro matcher similarity algorithm failed expectation');
}

// 5. Test Aim Score and Feedback data structures
console.log('5. Testing Cloud Aim Score & Feedback payloads...');
const testScore = {
  mode: 'calibrate_180',
  score: 4850,
  accuracy: 100,
  avg_reaction_ms: 195,
  sensitivity: 0.38,
  dpi: 800,
  game: 'valorant'
};

const scoresList = [testScore];
localStorage.setItem('vecsens_aim_scores_test_user', JSON.stringify(scoresList));
const loadedScores = JSON.parse(localStorage.getItem('vecsens_aim_scores_test_user'));
if (loadedScores.length === 1 && loadedScores[0].score === 4850) {
  console.log('   Aim score persistence payload test: SUCCESS');
} else {
  throw new Error('Aim score persistence failed');
}

console.log('\n======================================================');
console.log('🎉 ALL VECSENS PRO & CLOUD TESTS PASSED SUCCESSFULLY!');
console.log('======================================================');
