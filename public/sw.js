importScripts('/src/assets/js/idb.js');
importScripts('/src/utility.js');

var CACHE_STATIC_NAME = 'static-v30';
var CACHE_DYNAMIC_NAME = 'dynamic-v4';
var STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/app.js',
  '/src/feed.js',
  '/src/assets/js/idb.js',
  '/src/assets/js/promise.js',
  '/src/assets/js/fetch.js',
  '/src/assets/js/material.min.js',
  '/src/assets/css/app.css',
  '/src/assets/css/feed.css',
  'src/assets/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

function handleInstallingServiceWorker (event) {
  console.log('[Service Worker] Installing', event);
  precachingStaticFiles(event, CACHE_STATIC_NAME, STATIC_FILES)
}

function handleActivatingServiceWorker (event) {
  console.log('[Service Worker] Activating', event);
  removeOldCaches(event, CACHE_STATIC_NAME, CACHE_DYNAMIC_NAME)
  return self.clients.claim();
}

function handleFetchingData (event) {
  cacheByCacheThenNetworkStrategy(event, 'http://localhost:3000/posts', STATIC_FILES, CACHE_STATIC_NAME, CACHE_DYNAMIC_NAME)
}

function handleSyncingData (event) {
  syncDataInBackground(event, 'http://localhost:3000/posts', 'sync-new-posts', 'sync-posts', sendData)
}

function sendData (item, url) {
  var postHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  var postBody = JSON.stringify({
    id: item.id,
    title: item.title,
    location: item.location,
    iamge: 'XXX'
  });
  fetch(url, {
    method: 'POST',
    headers: postHeaders,
    body: postBody
  })
  .then(function (response) {
    console.log('[Service Worker] Data is sent to the server', response);
    if (response.ok) {
      deleteItemFromData('sync-posts', item.id);
    }
  })
  .catch(function (error) {
    console.log('[Service Worker] Error occured while sending data to server', error);
  })
}

self.addEventListener('install', handleInstallingServiceWorker);

self.addEventListener('activate', handleActivatingServiceWorker);

self.addEventListener('fetch', handleFetchingData);

self.addEventListener('sync', handleSyncingData)

self.addEventListener('notificationclick', handleNotificationClick);

self.addEventListener('notificationclose', handleNotificationClose);