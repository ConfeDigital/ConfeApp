// sessionExpiredEvent.js
const listeners = [];

export function onSessionExpired(listener) {
  listeners.push(listener);
}

export function triggerSessionExpired() {
  listeners.forEach((listener) => listener());
}
