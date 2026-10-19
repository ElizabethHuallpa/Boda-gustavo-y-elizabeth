const env = document.getElementById('env');
const main = document.getElementById('main');
const playButton = document.getElementById('mc');
const audio = document.getElementById('bg');
const seal = document.querySelector('.ev-seal');

function openInv() {
  env.classList.add('open');
  document.body.classList.remove('lock');
  main.classList.add('show');
}

function toggleMusic() {
  if (!audio) return;
  if (audio.paused) {
    audio.play();
    playButton.textContent = '🔇';
  } else {
    audio.pause();
    playButton.textContent = '🔊';
  }
}

function updateCountdown() {
  const target = new Date('2026-12-12T18:00:00');
  const now = new Date();
  const diff = target - now;

  if (diff <= 0) {
    document.getElementById('days').textContent = '00';
    document.getElementById('hours').textContent = '00';
    document.getElementById('minutes').textContent = '00';
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  document.getElementById('days').textContent = String(days).padStart(2, '0');
  document.getElementById('hours').textContent = String(hours).padStart(2, '0');
  document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
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
