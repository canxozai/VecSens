const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const checks = [
  { name: 'Supabase JS CDN script loaded in head', ok: html.includes('@supabase/supabase-js@2') },
  { name: 'userAuthContainer present in top controls', ok: html.includes('id="userAuthContainer"') },
  { name: 'History nav tab (ntab-history) present in navbar', ok: html.includes('id="ntab-history"') },
  { name: 'History page container (page-history) present', ok: html.includes('id="page-history"') },
  { name: 'Auth Modal (#authModal) present', ok: html.includes('id="authModal"') },
  { name: 'User Profile Modal (#userProfileModal) present', ok: html.includes('id="userProfileModal"') },
  { name: 'Compare Modal (#compareModal) present', ok: html.includes('id="compareModal"') },
  { name: 'Save Analysis Modal (#saveAnalysisModal) present', ok: html.includes('id="saveAnalysisModal"') },
  { name: 'Cloud Config Modal (#cloudConfigModal) present', ok: html.includes('id="cloudConfigModal"') },
  { name: 'VecSensCloud object defined', ok: html.includes('const VecSensCloud = {') },
  { name: 'VecSensCloud.init called in initVecSens', ok: html.includes('VecSensCloud.init();') },
  { name: 'switchPage router includes history', ok: html.includes("page === 'history'") },
  { name: 'showResults has Save to Cloud History button', ok: html.includes('openSaveAnalysisModal()') },
  { name: 'Home page has History & Cloud feature card', ok: html.includes("switchPage('history')") },
  { name: 'getAvatarSvg helper defined with esports avatars', ok: html.includes('function getAvatarSvg') },
  { name: 'getVsSvg helper defined with line-art SVGs', ok: html.includes('function getVsSvg') },
  { name: 'I18N Turkish includes history keys', ok: html.includes("tabHistory: 'Geçmiş'") && html.includes("histTitle: 'Geçmiş Analizlerim'") },
  { name: 'I18N English includes history keys', ok: html.includes("tabHistory: 'History'") && html.includes("histTitle: 'Saved Analyses Vault'") }
];

console.log('=== VECSENS CLOUD AUTH & HISTORY INTEGRITY CHECKS ===\n');
let allPassed = true;
checks.forEach((c, idx) => {
  console.log(`${idx + 1}. [${c.ok ? 'PASS' : 'FAIL'}] ${c.name}`);
  if (!c.ok) allPassed = false;
});

if (allPassed) {
  console.log('\n>>> SUCCESS: ALL 18 INTEGRITY CHECKS PASSED! <<<');
  process.exit(0);
} else {
  console.error('\n>>> ERROR: SOME INTEGRITY CHECKS FAILED! <<<');
  process.exit(1);
}
