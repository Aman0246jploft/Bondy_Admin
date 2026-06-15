// src/api/loaderState.js

let listeners = [];
let loadingCount = 0;

export const loaderState = {
  show() {
    loadingCount++;
    listeners.forEach((l) => l(loadingCount > 0));
  },
  hide() {
    loadingCount = Math.max(0, loadingCount - 1);
    listeners.forEach((l) => l(loadingCount > 0));
  },
  subscribe(listener) {
    listeners.push(listener);
    // Call listener immediately with current state
    listener(loadingCount > 0);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};
