var deferredPrompt;
var enableNotifictaionsButtons = document.querySelectorAll('.enable-notifications')

function registerServiceWorker (serviceWorkerName) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(serviceWorkerName)
      .then(function () {
        console.log(`${serviceWorkerName} registered succeessfully!`);
      })
      .catch(function (error) {
        console.log(`An error occured when ${serviceWorkerName} was being registered :(`, error);
      });
  }
}

function handleBeforeInstallPrompt (event) {
  console.log('beforeinstallprompt fired');
  event.preventDefault();
  deferredPrompt = event;
  return false;
}

function displayConfirmNotification () {
  var options = {
    body: 'You successfully subscribed to our Notification service!',
    icon: '/src/assets/images/icons/app-icon-96x96.png',
    iamge: '/src/assets/images/sf-boat.jpg',
    dir: 'ltr',
    lang: 'en-US',
    vibrate: [100, 50, 200],
    badge: '/src/assets/images/icons/app-icon-96x96.png',
    tag: 'confirm-notification',
    renotify: true,
    actions: [
      { action: 'confirm', title: 'Okay', icon: '/src/assets/images/icons/app-icon-96x96.png' },
      { action: 'cancel', title: 'Cancel', icon: '/src/assets/images/icons/app-icon-96x96.png' }
    ]
  };
  if ('serviceWorker' in navigator) {  
    navigator.serviceWorker.ready
      .then(function (swRegistration) {
        swRegistration.showNotification('Your are Successfully Subscribed!', options);
      });
  }  
}

function askForNotificationPermission () {
  Notification.requestPermission(function (result) {
    console.log('User Choise:', result);
    if (result !== 'granted') {
      console.log('No notification permission granted by you!');
    } else {
      displayConfirmNotification();
    }
  });
}

if (!window.Promise) {
  window.Promise = Promise;
}

registerServiceWorker('/service-worker.js');

window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

if (('Notification' in window) && ('serviceWorker' in navigator)) {
  for (var i = 0; i < enableNotifictaionsButtons.length; i++) {
    enableNotifictaionsButtons[i].style.display = 'inline-block';
    enableNotifictaionsButtons[i].addEventListener('click', askForNotificationPermission);
  }
}

// function configurePushSubscription () {
//   if (!('serviceWorker' in navigator)) {
//     return;
//   }
//   var registration;
//   navigator.serviceWorker.ready
//     .then((swRegistration) => {
//       registration = swRegistration;
//       return swRegistration.pushManager.getSubscription();
//     })
//     .then((subscription) => {
//       if (subscription === null) {
//         registration.pushManager.subscribe({
//           userVisibleOnly: true
//         });
//       }  else {

//       }  
//     });
// }