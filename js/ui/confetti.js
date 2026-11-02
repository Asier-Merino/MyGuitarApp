// Celebración (BUILD_PLAN 6.1): confeti breve y discreto (≈1,5 s), sin sonido, en una ronda
// perfecta o al batir un récord. Si el sistema pide reducir el movimiento, no se muestra.

const COLORS = ['--amber', '--fn-third', '--fn-fifth', '--fn-seventh', '--fn-root'];
const PIECES = 36;

export function celebrate() {
  if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.createElement('div');
  layer.className = 'confetti';
  layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < PIECES; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti__piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = `var(${COLORS[i % COLORS.length]})`;
    piece.style.animationDelay = `${Math.random() * 0.25}s`;
    piece.style.animationDuration = `${1.1 + Math.random() * 0.5}s`;
    piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 120}px`);
    piece.style.setProperty('--spin', `${(Math.random() - 0.5) * 720}deg`);
    layer.append(piece);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 2000);
}
