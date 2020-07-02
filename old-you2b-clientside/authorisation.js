import { display_logic } from '/API.js';

var GoogleAuth;
var SCOPE = 'https://www.googleapis.com/auth/youtube.force-ssl';

export function handleClientLoad() {
  // Load the API's client and auth2 modules.
  // Call the initClient function after the modules load.
  gapi.load('client:auth2', initClient);
}

// loads in authorisation and then everything else

function initClient() {
  // Retrieve the discovery document for version 3 of YouTube Data API.
  // In practice, your app can retrieve one or more discovery documents.
  var discoveryUrl = 'https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest';

  // Initialize the gapi.client object, which app uses to make API requests.
  // Get API key and client ID from API Console.
  // 'scope' field specifies space-delimited list of access scopes.
  gapi.client.init({
    'apiKey': 'AIzaSyC7gpazlJU7kaIKf2sDsjFWXJHesx4B6kE',
    'discoveryDocs': [discoveryUrl],
    'clientId': '20829526560-c3ilnjqmvkfo187fmoojnjeasfhnoesj.apps.googleusercontent.com',
    'scope': SCOPE
  }).then(function() {
    GoogleAuth = gapi.auth2.getAuthInstance();

    // Listen for sign-in state changes.
    GoogleAuth.isSignedIn.listen(updateSigninStatus);

    // Handle initial sign-in state. (Determine if user is already signed in.)
    var user = GoogleAuth.currentUser.get();
    setSigninStatus();

    // Call handleAuthClick function when user clicks on
    //      "Sign In" button.
    $('#sign-in-or-out-button').click(function() {
      handleAuthClick();
    });
  });
}

function handleAuthClick() {
  if (GoogleAuth.isSignedIn.get()) {
    // User is authorized and has clicked 'Sign out' button.
    GoogleAuth.signOut();
    $("#results").empty();
  } else {
    // User is not signed in. Start Google auth flow.
    GoogleAuth.signIn();
  }
}

function setSigninStatus(isSignedIn) {
  var user = GoogleAuth.currentUser.get();
  var isAuthorized = user.hasGrantedScopes(SCOPE);
  if (isAuthorized) {
    $('#sign-in-or-out-button').html('Sign out');
    $('#revoke-access-button').css('display', 'inline-block');
    // $('#auth-status').html('You are currently signed in and have granted ' +
    //   'access to this app.');
    display_logic();
  } else {
    $('#sign-in-or-out-button').html('Sign In/Authorize');
    $('#revoke-access-button').css('display', 'none');
    $('#auth-status').html('You have not authorized this app or you are ' +
      'signed out.');
  }

}

function updateSigninStatus(isSignedIn) {
  setSigninStatus();
}
/////////////////////
////Additions made///
/////////////////////

// interacting with the API ///
// global variables //
