const env = document.getElementById('env');
const main = document.getElementById('main');
const playButton = document.getElementById('mc');
const audio = document.getElementById('bg');
const seal = document.querySelector('.ev-seal');

function openInv() {
  if (env) env.classList.add('open');
  document.body.classList.remove('lock');
  if (main) main.classList.add('show');
}

function toggleMusic() {
  if (!audio) return;

  if (audio.paused) {
    audio.play().catch(() => {});
    if (playButton) playButton.textContent = '🔇';
  } else {
    audio.pause();
    if (playButton) playButton.textContent = '🔊';
  }
}

function updateCountdown() {
  const target = new Date('2026-12-12T18:00:00');
  const now = new Date();
  const diff = target - now;

  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');

  if (!daysEl || !hoursEl || !minutesEl) return;

  if (diff <= 0) {
    daysEl.textContent = '00';
    hoursEl.textContent = '00';
    minutesEl.textContent = '00';
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  daysEl.textContent = String(days).padStart(2, '0');
  hoursEl.textContent = String(hours).padStart(2, '0');
  minutesEl.textContent = String(minutes).padStart(2, '0');
}

seal?.addEventListener('click', openInv);
seal?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openInv();
  }
});

playButton?.addEventListener('click', toggleMusic);
setInterval(updateCountdown, 60000);
updateCountdown();
