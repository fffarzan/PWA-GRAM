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

workboxSW.precache([]);

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