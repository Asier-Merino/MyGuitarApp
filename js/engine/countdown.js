// Temporizador que se puede pausar (lo usan los motores de ejercicio): cuenta atrás de una
// pregunta o consigna, paso automático tras acertar, duración de la ronda y tiempo de práctica.
// El reloj y los temporizadores se pueden inyectar para probarlo sin esperar.

/**
 * createCountdown({ ms, onTick(restanteMs), onDone, tickMs })
 * ms = null: cuenta hacia arriba sin fin (cronómetro); onTick recibe entonces el tiempo transcurrido.
 */
export function createCountdown({
  ms,
  onTick,
  onDone,
  tickMs = 100,
  now = () => performance.now(),
  setTimer = (fn, t) => setInterval(fn, t),
  clearTimer = (id) => clearInterval(id),
}) {
  let elapsed = 0;
  let since = null; // instante desde el que corre (null = parado)
  let timer = null;
  let finished = false;

  const current = () => elapsed + (since === null ? 0 : now() - since);
  const report = () => onTick?.(ms === null ? current() : Math.max(0, ms - current()));

  function tick() {
    if (finished) return;
    if (ms !== null && current() >= ms) {
      finish();
      onDone?.();
      return;
    }
    report();
  }

  function finish() {
    elapsed = current();
    since = null;
    finished = true;
    if (timer !== null) clearTimer(timer);
    timer = null;
  }

  return {
    start() {
      if (finished || since !== null) return;
      since = now();
      timer = setTimer(tick, tickMs);
      report();
    },
    pause() {
      if (finished || since === null) return;
      elapsed = current();
      since = null;
      if (timer !== null) clearTimer(timer);
      timer = null;
    },
    /** Para del todo, sin llamar a onDone. */
    cancel: finish,
    get elapsed() { return current(); },
    get remaining() { return ms === null ? null : Math.max(0, ms - current()); },
    get running() { return since !== null; },
    get finished() { return finished; },
  };
}
