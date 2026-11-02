// Cálculos sobre el registro de sesiones (sin DOM). Cada entrada guarda al menos
// `date` (ISO o milisegundos) y `seconds` (duración de la ronda). La Fase 1B lo rellena.

/** Día local 'AAAA-MM-DD' de una fecha. */
export function dayKey(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** { days: días distintos con práctica, seconds: tiempo total }. Ignora entradas mal formadas. */
export function practiceTotals(history = []) {
  const days = new Set();
  let seconds = 0;
  for (const entry of history) {
    if (!entry || Number.isNaN(new Date(entry.date).getTime())) continue;
    days.add(dayKey(entry.date));
    if (Number.isFinite(entry.seconds) && entry.seconds > 0) seconds += entry.seconds;
  }
  return { days: days.size, seconds };
}

/**
 * Racha: días seguidos con práctica que terminan hoy. Si hoy aún no se ha practicado,
 * cuenta hasta ayer (la racha no se pierde hasta que acaba el día).
 */
export function currentStreak(history = [], now = new Date()) {
  const days = new Set();
  for (const entry of history) {
    if (entry && !Number.isNaN(new Date(entry.date).getTime())) days.add(dayKey(entry.date));
  }
  const day = new Date(now);
  day.setHours(12, 0, 0, 0); // mediodía: evita sorpresas con los cambios de hora
  if (!days.has(dayKey(day))) day.setDate(day.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(day))) {
    streak += 1;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

/** '2 min 30 s', '4 min', '45 s', '1 h 5 min' (duración de una ronda). */
export function formatElapsed(totalSeconds) {
  const s = Math.round(totalSeconds);
  if (s < 60 || s >= 3600) return formatDuration(s);
  const rest = s % 60;
  return rest ? `${Math.floor(s / 60)} min ${rest} s` : `${s / 60} min`;
}

/** '6 h 40 min', '12 min', '45 s'. */
export function formatDuration(totalSeconds) {
  const s = Math.round(totalSeconds);
  if (s < 60) return `${s} s`;
  const minutes = Math.floor(s / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${minutes} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}
