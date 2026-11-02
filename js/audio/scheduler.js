// Reloj con lookahead (BUILD_PLAN 1B): cada 25 ms mira qué sonidos caen en los próximos
// 100 ms y los programa sobre el reloj del audio (audioCtx.currentTime). Así el pulso es
// estable aunque el temporizador de JavaScript se retrase un poco.
// Sin Web Audio: el reloj (`now`) y los temporizadores se inyectan, para poder probarlo.

export const LOOKAHEAD_S = 0.1;
export const INTERVAL_MS = 25;
/** Si el reloj se ha adelantado más que esto (app en segundo plano), no se recuperan los sonidos perdidos. */
export const MAX_LATE_S = 0.05;

/**
 * now(): segundos del reloj del audio.
 * onEvent(time): programa un sonido en `time` y devuelve cuándo va el siguiente (o null para parar).
 */
export function createScheduler({
  now,
  onEvent,
  lookahead = LOOKAHEAD_S,
  interval = INTERVAL_MS,
  setTimer = (fn, ms) => setInterval(fn, ms),
  clearTimer = (id) => clearInterval(id),
}) {
  let nextTime = null;
  let timer = null;

  function tick() {
    if (nextTime === null) return;
    const current = now();
    // Al volver de segundo plano, en vez de soltar de golpe los clics perdidos, se sigue desde ahora.
    if (nextTime < current - MAX_LATE_S) nextTime = current + 0.02;
    while (nextTime !== null && nextTime < current + lookahead) {
      nextTime = onEvent(nextTime);
    }
    if (nextTime === null) stop();
  }

  function stop() {
    if (timer !== null) clearTimer(timer);
    timer = null;
    nextTime = null;
  }

  return {
    /** Empieza: el primer sonido en `firstTime` (por defecto, dentro de 50 ms). */
    start(firstTime = now() + 0.05) {
      stop();
      nextTime = firstTime;
      timer = setTimer(tick, interval);
      tick();
    },
    stop,
    tick,
    get running() { return nextTime !== null; },
  };
}
