importScripts('workbox-sw.prod.v2.1.3.js');
importScripts('/src/assets/js/idb.js');
importScripts('/src/utility.js');

const workboxSW = new self.WorkboxSW();

workboxSW.router.registerRoute(
    /.*(?:googleapis|gstatic)\.com.*$/, 
    workboxSW.strategies.staleWhileRevalidate({
        cacheName: 'google-fonts',
        cacheExpiration: {
            maxEntries: 3,
            maxAgeSeconds: 60 * 60 * 24 * 30
        }
    })
);

workboxSW.router.registerRoute(
    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css', 
    workboxSW.strategies.staleWhileRevalidate({
        cacheName: 'material-css'
    })
);

workboxSW.router.registerRoute(
    /.*(?:firebasestorage\.googleapis)\.com.*$/, 
    workboxSW.strategies.staleWhileRevalidate({
        cacheName: 'google-fonts'
    })
);

workboxSW.router.registerRoute('http://localhost:3000/posts', function (args) {
    return fetch(args.event.request)
        .then(function (response) {
            var clonedResponse = response.clone();
            clearAllData('posts')
                .then(function () {
                    return clonedResponse.json();
                })
                .then(function (data) {
                    for (var key in data) {
                        writeData('posts', data[key]);
                    }
                });        
            return response;
        })
});

workboxSW.router.registerRoute(
    function (routeData) {
        return (routeData.event.request.headers.get('accept').includes('text/htnl'));
    }, 
    function (args) {
        return caches.match(args.event.request)
            .then(function (matchResponse) {
                if (matchResponse) {
                    return matchResponse
                } else {
                    return fetch(args.event.request)
                        .then(function (fetchResponse) {
                            return caches.open('dynamic')
                                .then(function (cache) {
                                    cache.put(args.event.request.url, fetchResponse.clone());
                                    return fetchResponse;
                                })
                                .catch(function () {
                                    return caches.match('/offline.html')
                                        .then(function (response) {
                                            return response;
                                        });
                                })
                        })
                }
            })
    }
);

workboxSW.precache([
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "43eb094b5f92daf97b56f657c5a95a1b"
  },
  {
    "url": "manifest.json",
    "revision": "5732fdd6018253267ce599dc52b50546"
  },
  {
    "url": "offline.html",
    "revision": "37979a7ffc6a65ed88fb8ed7b0568dda"
  },
  {
    "url": "service-worker.js",
    "revision": "3d16cbe764a8f411414b698aaf80cccf"
  },
  {
    "url": "src/app.js",
    "revision": "0667f6bc6b65bcdd5b43450badd38464"
  },
  {
    "url": "src/assets/css/app.css",
    "revision": "ffed0d57e450481d115a3e1eaccfe002"
  },
  {
    "url": "src/assets/css/feed.css",
    "revision": "6d596288bc34fa78fd665dfa0313c766"
  },
  {
    "url": "src/assets/css/help.css",
    "revision": "81922f16d60bd845fd801a889e6acbd7"
  },
  {
    "url": "src/assets/js/fetch.js",
    "revision": "a368dece9f9a713eea5f20964679bf1e"
  },
  {
    "url": "src/assets/js/idb.js",
    "revision": "edfbee0bb03a5947b5a680c980ecdc9f"
  },
  {
    "url": "src/assets/js/material.min.js",
    "revision": "e68511951f1285c5cbf4aa510e8a2faf"
  },
  {
    "url": "src/assets/js/promise.js",
    "revision": "b824449b966ea6229ca6d31b53abfcc1"
  },
  {
    "url": "src/feed.js",
    "revision": "c93a953371723cb2d8127f76a400704f"
  },
  {
    "url": "src/utility.js",
    "revision": "de341f0c767170fee140d4751304f4c9"
  },
  {
    "url": "sw-base.js",
    "revision": "ba9db06dbe0e06b41a521e47ad41b9bd"
  },
  {
    "url": "workbox-sw.prod.v2.1.3.js",
    "revision": "a9890beda9e5f17e4c68f42324217941"
  },
  {
    "url": "src/assets/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/assets/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/assets/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/assets/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  }
]);

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

self.addEventListener('sync', function (event) {
    syncDataInBackground(event, 'http://localhost:3000/posts', 'sync-new-posts', 'sync-posts', sendData)
})

self.addEventListener('notificationclick', handleNotificationClick);

self.addEventListener('notificationclose', handleNotificationClose);