// sw.js

/**
 * @file This service worker handles caching for the Medzillo PWA,
 * enabling offline functionality and faster load times.
 */

// Define the cache name, which acts as a version identifier.
// Change this name to force an update of the cache on activation.
const CACHE_NAME = 'medzillo-v1';

// A list of essential files to be cached during the service worker installation.
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  // NOTE: In a real build process, you would add specific versioned JS/CSS bundles here.
  // For this environment, caching the main entry points will provide basic offline functionality.
];

/**
 * 'install' event listener.
 * This event is fired when the service worker is first installed.
 * It opens the cache and adds the core application shell files to it.
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

/**
 * 'fetch' event listener.
 * This event intercepts all network requests from the application.
 * It implements a "cache-first" strategy:
 * 1. It checks if a response for the request already exists in the cache.
 * 2. If found, the cached response is served immediately, avoiding a network trip.
 * 3. If not found in the cache, it fetches the resource from the network.
 */
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return the cached response.
        if (response) {
          return response;
        }
        // Not in cache - fetch from the network.
        return fetch(event.request);
      }
    )
  );
});

/**
 * 'activate' event listener.
 * This event is fired when the service worker is activated.
 * It's used to clean up old, unused caches to free up storage space.
 * It ensures that only the cache specified in `cacheWhitelist` remains.
 */
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // If a cache is not in our whitelist, delete it.
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
