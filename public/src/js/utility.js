function isInArray (string, array) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] === string) {
      return true;
    }
    return false;
  }
}

// service worker helpers
function unregisterServiceWorker () {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(function (registrations) {
        for (var i = 0; i < registrations.length; i++) {
          registrations[i].unregister();
        }
      })
  }
}

// caching helpers
function precachingStaticFiles (event, staticCacheName, staticFiles) {
  event.waitUntil(
    caches.open(staticCacheName)
      .then(function (cache) {
        console.log('[Service Worker] Precaching app shell');
        cache.addAll(staticFiles);
      })
  );
}

function removeOldCaches (event, staticCacheName, dynamicCacheName) {
  event.waitUntil(
    caches.keys()
      .then(function (keyList) {
        return Promise.all(keyList.map(function (key) {
          if (key !== staticCacheName && key !== dynamicCacheName) {
            console.log(`[Service Worker] Removing ${key} cache`);
            return caches.delete(key);
          }
        }))
      })
  );
}

function trimCache (cacheName, maxItems) {
  caches.open(cacheName)
    .then(function (cache) {
      return cache.keys()
        .then(function (keys) {
          if (keys.length > maxItems) {
            cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
          }
        })
    });
}

function cacheByCacheWithNetworkFallback () {
  // It's not good!
}

function cacheByNetworkWithCacheFallbackStrategy (event, dynamicCacheName) {
  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        return caches.open(dynamicCacheName)
          .then(function (cache) {
            cache.put(event.request.url, response.clone())
            return response
          })
          .catch(function () {
            return caches.match(event.request)
          })
      })
  )
}

function cacheByCacheOnlyStrategy (event) {
  return event.respondWith(
    caches.match(event.request)
  )
}

function cacheByNetworkOnlyStrategy (event) {
  return event.respondWith(
    fetch(event.request)
  )
}

function cacheByCacheThenNetworkStrategy (event, url, staticFiles, staticCacheName, dynamicCacheName) {
  if (event.request.url.indexOf(url) > -1) {
    clearAndWriteNewDataInIndexedDb(event, 'posts');
  } else if (isInArray(event.request.url, staticFiles)) {
    self.addEventListener('fetch', cacheByCacheOnlyStrategy);
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(function (matchResponse) {
          if (matchResponse) {
            return matchResponse
          } else {
            return fetch(event.request)
              .then(function (fetchResponse) {
                return caches.open(dynamicCacheName)
                  .then(function (cache) {
                    cache.put(event.request.url, fetchResponse.clone());
                    return fetchResponse;
                  })
                  .catch(function () {
                    showOfflinePageForUncachedPages(event, staticCacheName, '/offline.html')
                  })
              })
          }
        })
    );
  }
}

function showOfflinePageForUncachedPages (event, staticCacheName, offlinePageUrl) {
  if (event.request.headers.get('accept').includes('text/html')) {
    return caches.open(staticCacheName)
      .then(function (cache) {
        return cache.match(offlinePageUrl)
      });
  }
}

// indexedDb helpers
var dbPromise = idb.open('posts-store', 1, (db) => {
  if (!db.objectStoreNames.contains('posts')) {
    db.createObjectStore('posts', { keyPath: 'id' });
  }
  if (!db.objectStoreNames.contains('sync-posts')) {
    db.createObjectStore('sync-posts', { keyPath: 'id' });
  }
});

function writeData (storeName, data) {
  return dbPromise.then((db) => {
    var dbTransaction = db.transaction(storeName, 'readwrite');
    var store = dbTransaction.objectStore(storeName);
    store.put(data);
    return dbTransaction.complete;
  });
}

function readAllData (storeName) {
  return dbPromise.then((db) => {
    var dbTransaction = db.transaction(storeName, 'readonly');
    var store = dbTransaction.objectStore(storeName);
    return store.getAll();
  })
}

function clearAllData (storeName) {
  return dbPromise.then((db) => {
    var dbTransaction = db.transaction(storeName, 'readwrite');
    var store = dbTransaction.objectStore(storeName);
    store.clear();
    return dbTransaction.complete;
  })
}

function deleteItemFromData (storeName, id) {
  dbPromise
    .then((db) => {
      var dbTransaction = db.transaction(storeName, 'readwrite');
      var store = dbTransaction.objectStore(storeName);
      store.delete(id);
      return dbTransaction.complete;
    })
    .then(() => {
      console.log('Item deleted!');
    })
}

function clearAndWriteNewDataInIndexedDb (event, storeName) {
  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        var clonedResponse = response.clone();
        clearAllData(storeName)
          .then(function () {
            return clonedResponse.json();
          })
          .then(function (data) {
            for (var key in data) {
              writeData(storeName, data[key]);
            }
          });        
        return response;
      })
  )
}

// sync helpers
function registerBackgroundSync (serviceWorker, syncName) {
  return serviceWorker.sync.register(syncName);
}

function syncDataInBackground (event, url, tagName, storeName, sendRequestFn) {
  console.log('[Service Worker] Background syncing', event);
  if (event.tag === tagName) {
    console.log('[Service Worker] Syncing new items');
    event.waitUntil(
      readAllData(storeName)
        .then(function (data) {
          for (var item of data) {
            sendRequestFn(item, url)
          }
        })
    );
  }
}

// notification helpers
function handleNotificationClick (event) {
  var notification = event.notification;
  console.log('[Notification]', notification);
  var action = event.action;
  if (action === 'confirm') {
    console.log(`[Notification] OK was chosen (action: ${action})`);
  } else {
    console.log(`[Notification] Nope was chosen (action: ${action})`);
  }
  notification.close();
}

function handleNotificationClose (event) {
  console.log('[Notification] closed', event);
}