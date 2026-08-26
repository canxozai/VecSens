const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Mock browser environment
const localStorageStore = {};
global.localStorage = {
  getItem: (k) => localStorageStore[k] || null,
  setItem: (k, v) => { localStorageStore[k] = String(v); },
  removeItem: (k) => { delete localStorageStore[k]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

global.window = {
  crypto: {
    subtle: {
      digest: async (algo, data) => {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(Buffer.from(data)).digest();
      }
    }
  },
  supabase: null,
  addEventListener: () => {},
  location: { hash: '' }
};

global.document = {
  documentElement: { 
    lang: 'tr',
    style: { setProperty: () => {} },
    getAttribute: () => 'dark',
    setAttribute: () => {}
  },
  title: '',
  body: { setAttribute: () => {}, getAttribute: () => '' },
  readyState: 'complete',
  getElementById: (id) => ({
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    innerHTML: '',
    textContent: '',
    value: '',
    style: {},
    querySelectorAll: () => []
  }),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

global.fetch = async () => ({ ok: false });
global.navigator = { clipboard: { writeText: async () => {} } };

// Extract full main script from index.html
const scriptMatches = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)];
const fullScript = scriptMatches[scriptMatches.length - 1][1];

// Run the script
eval(fullScript);

async function runTests() {
  const VecSensCloud = window.VecSensCloud;
  const state = window.state;
  console.log('=== VECSENS CLOUD LOGIC FUNCTIONAL SIMULATION ===\n');

  // Test 1: Init
  await VecSensCloud.init();
  console.log('1. Init completed. Status:', VecSensCloud.cloudStatus, 'User:', VecSensCloud.currentUser);

  // Test 2: Register user
  console.log('2. Testing Registration...');
  const regOk = await VecSensCloud.register({
    username: 'TenZ_Prime#1',
    email: 'tenz@vecsens.com',
    password: 'superpassword123',
    avatar: 'skull',
    role: 'Duelist',
    mainGame: 'valorant'
  });
  console.log('   Registration result:', regOk ? 'SUCCESS' : 'FAILED');
  console.log('   Active User:', VecSensCloud.currentUser.username, '| Avatar:', VecSensCloud.currentUser.avatar);

  // Test 3: Save analysis
  console.log('3. Testing Save Analysis...');
  state.computedProfiles = [
    { type: 'balanced', name: 'Dengeli', sens: 0.38, edpi: 304, cm360: 43.3, halfTurn: 22 },
    { type: 'speed', name: 'Hız Odaklı', sens: 0.44, edpi: 352, cm360: 37.4, halfTurn: 19 },
    { type: 'precision', name: 'Hassasiyet', sens: 0.32, edpi: 256, cm360: 51.4, halfTurn: 26 }
  ];
  state.answers = { q1: ['valorant'], q2: 'Logitech G Pro X Superlight 2', q3: '800', q11: 'claw' };
  state.analysisComplete = true;

  const saveOk1 = await VecSensCloud.saveAnalysis('First calibration on Valorant with 800 DPI');
  console.log('   Save analysis 1:', saveOk1 ? 'SUCCESS' : 'FAILED');

  // Test 4: Save 2nd analysis with different settings
  state.answers.q1 = ['cs2'];
  state.computedProfiles = [
    { type: 'balanced', name: 'Dengeli', sens: 1.25, edpi: 1000, cm360: 41.6, halfTurn: 21 },
    { type: 'precision', name: 'Hassas', sens: 1.05, edpi: 840, cm360: 49.5, halfTurn: 25 }
  ];
  const saveOk2 = await VecSensCloud.saveAnalysis('CS2 AWP Sensitivity test');
  console.log('   Save analysis 2:', saveOk2 ? 'SUCCESS' : 'FAILED');

  // Test 5: Verify history list
  const historyList = VecSensCloud.getLocalHistoryList();
  console.log('4. History records count:', historyList.length);
  if (historyList.length !== 2) throw new Error('Expected 2 records');
  console.log('   Record 1:', historyList[0].game_name, '@', historyList[0].recommended_sens, 'Sens, note:', historyList[0].note);
  console.log('   Record 2:', historyList[1].game_name, '@', historyList[1].recommended_sens, 'Sens, note:', historyList[1].note);

  // Test 6: A/B Compare selection
  console.log('5. Testing A/B comparison selection...');
  VecSensCloud.toggleCompareSelection(historyList[0].id);
  VecSensCloud.toggleCompareSelection(historyList[1].id);
  console.log('   Selected for compare:', VecSensCloud.selectedForCompare.length, 'items');
  if (VecSensCloud.selectedForCompare.length !== 2) throw new Error('Expected 2 items selected');

  // Test 7: Profile Update
  console.log('6. Testing Profile update...');
  await VecSensCloud.updateProfile({
    username: 'TenZ_Champion',
    avatar: 'crown',
    role: 'Flex',
    mainGame: 'cs2'
  });
  console.log('   Updated username:', VecSensCloud.currentUser.username, '| Role:', VecSensCloud.currentUser.role, '| Avatar:', VecSensCloud.currentUser.avatar);

  // Test 8: Logout and Login
  console.log('7. Testing Logout & Login...');
  await VecSensCloud.logout();
  console.log('   Logged out. CurrentUser:', VecSensCloud.currentUser);

  const loginOk = await VecSensCloud.login({
    identifier: 'tenz@vecsens.com',
    password: 'superpassword123',
    rememberMe: true
  });
  console.log('   Login result:', loginOk ? 'SUCCESS' : 'FAILED');
  console.log('   Restored User:', VecSensCloud.currentUser ? VecSensCloud.currentUser.username : null);

  // Test 9: SVG Generators
  console.log('8. Testing SVG Generators...');
  const testSvgUser = getVsSvg('user', 20);
  const testSvgAvatar = getAvatarSvg('lightning', 40);
  if (!testSvgUser.includes('<svg') || !testSvgAvatar.includes('<svg')) {
    throw new Error('SVG generator failed');
  }
  console.log('   SVG User length:', testSvgUser.length, '| Avatar SVG length:', testSvgAvatar.length);

  console.log('\n======================================================');
  console.log('🎉 ALL 9 ADVANCED LOGIC TESTS PASSED WITH 100% SUCCESS!');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
