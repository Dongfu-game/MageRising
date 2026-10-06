/* Landscape launch: manifest preference + runtime lock + explicit fullscreen fallback. */
(() => {
  'use strict';
  const coarse = () => matchMedia('(pointer: coarse)').matches;
  const installed = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
  const notice = document.getElementById('rotateNotice');
  if (!notice) return;
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'primary'; button.textContent = '가로 화면으로 시작';
  button.style.cssText = 'max-width:280px;padding:14px 22px;margin:12px auto;font-size:16px;display:block';
  const hint = notice.querySelector('p');
  notice.appendChild(button);
  let pending = false;
  async function lock() {
    if (!screen.orientation || typeof screen.orientation.lock !== 'function') return false;
    try { await screen.orientation.lock('landscape'); return true; } catch (_) { return false; }
  }
  async function start() {
    if (pending) return;
    pending = true; button.disabled = true;
    try {
      let ok = await lock();
      if (!ok && !document.fullscreenElement && document.documentElement.requestFullscreen) {
        try { await document.documentElement.requestFullscreen(); } catch (_) {}
        ok = await lock();
      }
      if (!ok && innerHeight > innerWidth) hint.textContent = '자동 전환을 지원하지 않아요. 휴대폰 자동 회전을 켜고 가로로 돌려주세요.';
    } finally { pending = false; button.disabled = false; }
  }
  button.addEventListener('click', start);
  const retry = () => { if (coarse() && installed() && !document.hidden) void lock(); };
  retry();
  document.addEventListener('visibilitychange', retry);
  document.addEventListener('fullscreenchange', () => { if (document.fullscreenElement && coarse()) void lock(); });
  document.addEventListener('pointerdown', retry, {once:true, passive:true});
})();
