/* ─── STATE ─── */
let stream        = null;
let facingMode    = 'user';
let skeletonOn    = false;
let recording     = false;
let selectedWorkout = 'Squats';
let animFrame     = null;
let skelFrame     = 0;
let zoomLevel     = 0;
let toastTimer    = null;

const ZOOM_LEVELS = ['🔍', '1.5×', '2×'];

//GO TO
function goToTrack() {
  document.getElementById('dashPage').classList.add('hidden');
  document.getElementById('trackPage').classList.remove('hidden');
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-tab')[1].classList.add('active');
}

function goToDash() {
  stopCamera();
  document.getElementById('trackPage').classList.add('hidden');
  document.getElementById('dashPage').classList.remove('hidden');
  document.querySelectorAll('.nav-tab')[0].classList.add('active');
}

function navigateWithSlide(url, direction = "left"){
    const pageEl = DocumentFragment.querySelector(".page") || document.getElementById("dash") || document.getElementById("tracker");

    if (!pageEl){
        window.location.href = url; return;
    }

    document.body.classList.add("is-transitioning");
    const outClass = direction === "left" ? "slide-out-left" : "slide-out-right";
    pageEl.classList.add(outClass);
}

function switchTab(btn, tab) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  if (tab === 'track') goToTrack();
}

function setBottomActive(btn) {
  document.querySelectorAll('#dashPage .bottom-nav-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}




//SELECT WORKOUT
function selectWorkout(btn, name) {
  document.querySelectorAll('.workout-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  selectedWorkout = name;
  showToast(`${name} selected`);
}





//PROFILE
function openProfile() {
  document.getElementById('profileOverlay').classList.add('open');
}

function closeProfile(e) {
  if (!e || e.target === document.getElementById('profileOverlay')) {
    document.getElementById('profileOverlay').classList.remove('open');
  }
}

//TOAST
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

//RESIZE
window.addEventListener('resize', () => {
  if (!stream) return;
  const canvas    = document.getElementById('poseCanvas');
  const container = document.getElementById('cameraBg');
  canvas.width  = container.offsetWidth;
  canvas.height = container.offsetHeight;
});