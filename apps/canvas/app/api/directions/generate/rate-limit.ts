const clients = new Map<string, { started: number[]; active: boolean }>();

export function acquire(clientId: string) {
  const now = Date.now();
  const current = clients.get(clientId) ?? { started: [], active: false };
  current.started = current.started.filter((value) => now - value < 60_000);
  if (current.active || current.started.length >= 5) return { ok: false as const, retryAfter: 10 };
  current.active = true; current.started.push(now); clients.set(clientId, current);
  return { ok: true as const, release: () => { const value = clients.get(clientId); if (value) value.active = false; } };
}
