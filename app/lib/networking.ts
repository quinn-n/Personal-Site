interface CacheEntry {
  response: Promise<Response>;
  lastAccessed: number;
}

type Cache = Map<RequestInfo | URL, CacheEntry>;

const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

const requestHistory: Cache = new Map<RequestInfo | URL, CacheEntry>();
export const cachedFetch: typeof fetch = async (input, init) => {
  const url = input.toString();
  const historyEntry = requestHistory.get(url);
  if (historyEntry !== undefined) {
    if (Date.now() > historyEntry.lastAccessed + CACHE_DURATION) {
      // If cache is expired, remove entry
      requestHistory.delete(url);
    } else {
      // Duplicate the promise by chaining it
      return cloneResponsePromise(historyEntry.response);
    }
  }
  const response = fetch(input, init);
  requestHistory.set(url, {
    response,
    lastAccessed: Date.now(),
  });
  return cloneResponsePromise(response);
};

function cloneResponsePromise(promise: Promise<Response>) {
  return promise.then((response) => response.clone());
}
