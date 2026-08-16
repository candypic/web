// Wraps a promise so a stalled network request (one that never resolves OR
// rejects — not even a normal error) can't hang a loading state forever.
// Without this, `await somePromise()` inside a try/finally is only safe if
// the promise is guaranteed to settle; a stalled fetch settles neither way,
// so `finally { setLoading(false) }` never runs until the page is reloaded.
export function withTimeout(promise, ms = 15000, message = 'Request timed out. Please check your connection and try again.') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}
