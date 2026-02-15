interface CacheEntry {
  response: Promise<Response>;
  lastAccessed: number;
}

type Cache = Map<RequestInfo | URL, CacheEntry>;

const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

const requestHistory: Cache = new Map<RequestInfo | URL, CacheEntry>();
export const cachedFetch: typeof fetch = async (input, init) => {
  const method = init?.method ? init.method.toUpperCase() : "GET";
  if (method !== "GET") {
    // Only cache GET requests
    return fetch(input, init);
  }

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

  // If the response is not ok, remove it from the cache
  response.then((res) => {
    if (!res.ok) {
      requestHistory.delete(url);
    }
  });

  return cloneResponsePromise(response);
};

function cloneResponsePromise(promise: Promise<Response>) {
  return promise.then((response) => response.clone());
}
