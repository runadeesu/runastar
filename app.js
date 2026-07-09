const authView = document.getElementById('view-auth');
const verifyView = document.getElementById('view-verify');
const lobbyView = document.getElementById('view-lobby');
const tabs = [...document.querySelectorAll('.tab')];
const form = document.getElementById('auth-form');
const nameField = document.getElementById('name');
const submitBtn = document.getElementById('auth-submit');
const hint = document.getElementById('auth-hint');
const signout = document.getElementById('signout');
const signoutVerify = document.getElementById('signout-verify');
const resendVerification = document.getElementById('resend-verification');

let mode = 'login';

function show(view){[authView,verifyView,lobbyView].forEach(v=>v.classList.add('hidden'));view.classList.remove('hidden');}
function setMode(next){mode = next;tabs.forEach(t=>t.classList.toggle('active', t.dataset.tab===next));nameField.classList.toggle('hidden', next!=='register');submitBtn.textContent = next==='login' ? 'ログイン' : '新規登録';}
function fakeLoad(){const saved = localStorage.getItem('runastar_session'); if(saved){const session = JSON.parse(saved); document.getElementById('player-meta').textContent = `${session.name || 'Luna'} / ${session.email}`; show(lobbyView); return true;} return false;}

window.addEventListener('load', () => {
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
  fakeLoad() || show(authView);
});

tabs.forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.tab)));
setMode('login');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const name = document.getElementById('name').value.trim() || 'Luna';
  if(!email || !password){ hint.textContent = 'メールアドレスとパスワードを入力してください。'; return; }
  if(mode === 'register'){
    localStorage.setItem('runastar_pending_verification', JSON.stringify({ name, email }));
    hint.textContent = '確認メールを送った体で進む初期版です。Firebase をつなげると本物の確認にできます。';
    show(verifyView);
    return;
  }
  const session = { name, email, level: 1, xp: 0, coins: 1200, gems: 350 };
  localStorage.setItem('runastar_session', JSON.stringify(session));
  document.getElementById('player-meta').textContent = `Lv.${session.level} / ${session.xp} XP`;
  document.getElementById('coins').textContent = session.coins;
  document.getElementById('gems').textContent = session.gems;
  show(lobbyView);
});

function logout(){ localStorage.removeItem('runastar_session'); show(authView); }
signout.addEventListener('click', logout);
signoutVerify.addEventListener('click', logout);
resendVerification.addEventListener('click', () => { hint.textContent = '確認メール再送のダミー処理です。Firebase 導入時に本実装へ置き換えます。'; });

if('serviceWorker' in navigator){ navigator.serviceWorker.register('./sw.js').catch(()=>{}); }
