var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');

var url = 'http://localhost:3000/posts';
var networkDataRecieved = false;

function openCreatePostModal () {
  createPostArea.style.transform = 'translateY(0)';
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice
      .then(function(choiceResult) {
        console.log(choiceResult.outcome);
        if (choiceResult.outcome === 'dismissed') {
          console.log('User cancelled installation');
        } else {
          console.log('User added to home screen');
        }
      });
    deferredPrompt = null;
  }
}

function closeCreatePostModal () {
  createPostArea.style.transform = 'translateY(100vh)';
}

function onSaveButtonClicked (event) {
  console.log('clicked');
  if ('caches' in window) {
    caches.open('user-requested')
      .then(function(cache) {
        cache.add('https://httpbin.org/get');
        cache.add('/src/images/sf-boat.jpg');
      });
  }
}

function clearCards () {
  while(sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild)
  }
}

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url(' + data.image + ')';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'white';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI (data) {
  clearCards();
  for (var i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
}

function sendData () {
  var postHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  var postBody = JSON.stringify({
    id: new Date().toISOString(),
    title: titleInput.value,
    location: locationInput.value,
    iamge: 'XXX'
  });
  fetch(url, {
    method: 'POST',
    headers: postHeaders,
    body: postBody
  })
  .then((response) => {
    console.log('Data sent to the server', response);
    updateUI();
  })
}

function showMaterialSnackbar () {
  var snackbarContainer = document.querySelector('#confirmation-toast');
  var data = {message: 'Your Post was saved for syncing!'};
  snackbarContainer.MaterialSnackbar.showSnackbar(data);
}

function syncDataInIndexedDb () {
  navigator.serviceWorker.ready
    .then(function (serviceWorker) {
      var post = {
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value
      };
      writeData('sync-posts', post)
        .then(function () {
          return registerBackgroundSync(serviceWorker, 'sync-new-posts');
        })
        .then(function () {
          showMaterialSnackbar()
        })
        .catch(function (error) {
          console.log('Error occured when creating a sync', error);
        });
    });
}

function onSubmitData (event) {
  event.preventDefault();
  if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    alert('Please Enter Valid Data!');
    return;
  }
  closeCreatePostModal();
  if (('serviceWorker' in navigator) && ('SyncManager' in window)) {
    syncDataInIndexedDb();
  } else {
    sendData();
  }
}

fetch(url)
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {
    networkDataRecieved = true;
    console.log('From Web', data);
    updateUI(data);
  });

if ('indexedDB' in window) {
  readAllData('posts').then((data) => {
    if (!networkDataRecieved) {
      console.log('From Cache', data);
      updateUI(data);
    }
  });
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

form.addEventListener('submit', onSubmitData);