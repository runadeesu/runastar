const views = {
  auth: document.getElementById('view-auth'),
  verify: document.getElementById('view-verify'),
  lobby: document.getElementById('view-lobby'),
  matchmaking: document.getElementById('view-matchmaking'),
  battleRoyale: document.getElementById('view-battle-royale'),
  friends: document.getElementById('view-friends'),
  clan: document.getElementById('view-clan'),
  game: document.getElementById('view-game')
};
const tabs = [...document.querySelectorAll('.tab')];
const form = document.getElementById('auth-form');
const nameField = document.getElementById('name');
const submitBtn = document.getElementById('auth-submit');
const hint = document.getElementById('auth-hint');
const signout = document.getElementById('signout');
const signoutVerify = document.getElementById('signout-verify');
const resendVerification = document.getElementById('resend-verification');
const startMatch = document.getElementById('start-match');
const startBr = document.getElementById('start-br');
const leaveMatch = document.getElementById('leave-match');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const hpValue = document.getElementById('hp-value');
const ammoValue = document.getElementById('ammo-value');
const enemyValue = document.getElementById('enemy-value');
const attackBtn = document.getElementById('attack-btn');
const dashBtn = document.getElementById('dash-btn');
const skillBtn = document.getElementById('skill-btn');
const buttons = {
  matchmaking: document.getElementById('open-matchmaking'),
  friends: document.getElementById('open-friends'),
  clan: document.getElementById('open-clan'),
  br: document.getElementById('open-br-lobby'),
  matchQueue: document.getElementById('match-queue'),
  cancelMatch: document.getElementById('cancel-match'),
  startBrMatch: document.getElementById('start-br-match'),
  backFromBr: document.getElementById('back-from-br'),
  sendFriendInvite: document.getElementById('send-friend-invite'),
  backFromFriends: document.getElementById('back-from-friends'),
  createClan: document.getElementById('create-clan'),
  backFromClan: document.getElementById('back-from-clan')
};

let mode = 'login';
let game = null;
const keys = new Set();
const roomState = { tick: 0, allies: 3, enemies: 3, online: true };

function show(name){ Object.values(views).forEach(v=>v.classList.add('hidden')); views[name].classList.remove('hidden'); }
function setMode(next){mode = next;tabs.forEach(t=>t.classList.toggle('active', t.dataset.tab===next));nameField.classList.toggle('hidden', next!=='register');submitBtn.textContent = next==='login' ? 'ログイン' : '新規登録';}
function syncLobby(session){document.getElementById('player-meta').textContent = `Lv.${session.level || 1} / ${session.xp || 0} XP`;document.getElementById('coins').textContent = session.coins ?? 1200;document.getElementById('gems').textContent = session.gems ?? 350;}
function fakeLoad(){const saved = localStorage.getItem('runastar_session'); if(saved){const session = JSON.parse(saved); syncLobby(session); show('lobby'); return true;} return false;}
function saveSession(session){ localStorage.setItem('runastar_session', JSON.stringify(session)); syncLobby(session); }

function startGame(label='3vs3 / クイックマッチ'){
  document.getElementById('game-mode-label').textContent = label;
  game = { x: 160, y: 270, vx: 0, vy: 0, hp: 100, ammo: 6, enemies: 3, bullets: [], lastShot: 0, dashCooldown: 0, skillCooldown: 0 };
  roomState.tick = 0; roomState.allies = 3; roomState.enemies = 3; roomState.online = true;
  hpValue.textContent = game.hp; ammoValue.textContent = game.ammo; enemyValue.textContent = game.enemies;
  show('game'); requestAnimationFrame(loop);
}
function backToLobby(){ show('lobby'); }

window.addEventListener('keydown', e => keys.add(e.key.toLowerCase()));
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));

function shoot(){ if(!game || game.ammo <= 0 || Date.now() - game.lastShot < 180) return; game.ammo -= 1; game.lastShot = Date.now(); ammoValue.textContent = game.ammo; game.bullets.push({ x: game.x + 26, y: game.y + 18, vx: 10, vy: 0 }); }
function dash(){ if(!game || game.dashCooldown > 0) return; game.x = Math.min(canvas.width - 60, game.x + 80); game.dashCooldown = 60; }
function skill(){ if(!game || game.skillCooldown > 0) return; game.skillCooldown = 180; game.enemies = Math.max(0, game.enemies - 1); enemyValue.textContent = game.enemies; }
attackBtn.addEventListener('click', shoot); dashBtn.addEventListener('click', dash); skillBtn.addEventListener('click', skill);

function update(){
  if(!game) return;
  const speed = 3.8;
  game.vx = 0; game.vy = 0;
  if(keys.has('w') || keys.has('arrowup')) game.vy -= speed;
  if(keys.has('s') || keys.has('arrowdown')) game.vy += speed;
  if(keys.has('a') || keys.has('arrowleft')) game.vx -= speed;
  if(keys.has('d') || keys.has('arrowright')) game.vx += speed;
  if(keys.has(' ') || keys.has('enter')) shoot();
  if(keys.has('shift')) dash();
  if(keys.has('q')) skill();
  game.x = Math.max(10, Math.min(canvas.width - 60, game.x + game.vx));
  game.y = Math.max(10, Math.min(canvas.height - 40, game.y + game.vy));
  game.dashCooldown = Math.max(0, game.dashCooldown - 1);
  game.skillCooldown = Math.max(0, game.skillCooldown - 1);
  game.bullets = game.bullets.map(b => ({...b, x: b.x + b.vx, y: b.y + b.vy})).filter(b => b.x < canvas.width + 20);
  roomState.tick += 1;
  if(roomState.tick % 120 === 0 && game.enemies > 0) { game.enemies -= 1; enemyValue.textContent = game.enemies; }
  if(game.enemies <= 0) { const session = JSON.parse(localStorage.getItem('runastar_session') || '{}'); session.xp = (session.xp || 0) + 120; session.level = (session.level || 1) + 1; saveSession(session); backToLobby(); }
}

function draw(){
  if(!game) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const grd = ctx.createLinearGradient(0,0,0,canvas.height);
  grd.addColorStop(0,'#1a2a50'); grd.addColorStop(1,'#0a1226');
  ctx.fillStyle = grd; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  for(let i=0;i<20;i++) ctx.fillRect((i*73)%canvas.width, (i*29)%canvas.height, 24, 24);
  ctx.fillStyle = '#2d3f72'; ctx.fillRect(250, 120, 120, 36); ctx.fillRect(480, 380, 160, 34); ctx.fillRect(610, 170, 60, 100);
  ctx.fillStyle = '#7c8cff'; ctx.fillRect(game.x, game.y, 32, 32);
  ctx.fillStyle = '#66ffb0'; ctx.fillRect(120, 120, 28, 28); ctx.fillRect(120, 240, 28, 28); ctx.fillRect(120, 360, 28, 28);
  ctx.fillStyle = '#ff7c7c'; for(let i=0;i<game.enemies;i++) ctx.fillRect(700 + i*70, 120 + (i%2)*90, 28, 28);
  ctx.fillStyle = '#ffd56a'; game.bullets.forEach(b => ctx.fillRect(b.x, b.y, 10, 4));
  ctx.fillStyle = '#e9eeff'; ctx.font = '18px system-ui'; ctx.fillText(`Room sync: ${roomState.online ? 'online' : 'offline'}`, 24, 34); ctx.fillText(`Allies: ${roomState.allies}  Enemies: ${game.enemies}`, 24, 60);
}
function loop(){ if(views.game.classList.contains('hidden')) return; update(); draw(); requestAnimationFrame(loop); }

window.addEventListener('load', () => { if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{}); fakeLoad() || show('auth'); });

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
    show('verify');
    return;
  }
  saveSession({ name, email, level: 1, xp: 0, coins: 1200, gems: 350 });
  show('lobby');
});

function logout(){ localStorage.removeItem('runastar_session'); show('auth'); }
signout.addEventListener('click', logout); signoutVerify.addEventListener('click', logout);
resendVerification.addEventListener('click', () => { hint.textContent = '確認メール再送のダミー処理です。Firebase 導入時に本実装へ置き換えます。'; });
startMatch.addEventListener('click', () => startGame('3vs3 / クイックマッチ'));
startBr.addEventListener('click', () => show('battleRoyale'));
leaveMatch.addEventListener('click', backToLobby);
buttons.matchmaking.addEventListener('click', () => show('matchmaking'));
buttons.friends.addEventListener('click', () => show('friends'));
buttons.clan.addEventListener('click', () => show('clan'));
buttons.br.addEventListener('click', () => show('battleRoyale'));
buttons.matchQueue.addEventListener('click', () => startGame('3vs3 / マッチメイキング'));
buttons.cancelMatch.addEventListener('click', backToLobby);
buttons.startBrMatch.addEventListener('click', () => startGame('バトルロイヤル / テスト'));
buttons.backFromBr.addEventListener('click', backToLobby);
buttons.sendFriendInvite.addEventListener('click', () => { alert('招待コードを送信しました（Phase 3 の土台）'); backToLobby(); });
buttons.backFromFriends.addEventListener('click', backToLobby);
buttons.createClan.addEventListener('click', () => { const clanName = document.getElementById('clan-name').value.trim() || 'Luna Clan'; alert(`${clanName} を作成しました（Phase 3 の土台）`); backToLobby(); });
buttons.backFromClan.addEventListener('click', backToLobby);
