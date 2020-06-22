var GoogleAuth;
var SCOPE = 'https://www.googleapis.com/auth/youtube.force-ssl';

function handleClientLoad() {
  // Load the API's client and auth2 modules.
  // Call the initClient function after the modules load.
  gapi.load('client:auth2', initClient);
}

function initClient() {
  // Retrieve the discovery document for version 3 of YouTube Data API.
  // In practice, your app can retrieve one or more discovery documents.
  var discoveryUrl = 'https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest';

  // Initialize the gapi.client object, which app uses to make API requests.
  // Get API key and client ID from API Console.
  // 'scope' field specifies space-delimited list of access scopes.
  gapi.client.init({
    'apiKey': 'AIzaSyDUVekPIHj3Kl-JlpuR6TXOg6q1xPPhNAg',
    'discoveryDocs': [discoveryUrl],
    'clientId': '195267143363-0c926kja79pnnaqpkt710p1tavvigasa.apps.googleusercontent.com',
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
    $('#auth-status').html('You are currently signed in and have granted ' +
      'access to this app.');
  } else {
    $('#sign-in-or-out-button').html('Sign In/Authorize');
    $('#revoke-access-button').css('display', 'none');
    $('#auth-status').html('You have not authorized this app or you are ' +
      'signed out.');
  }
  console.log(get_subscriptions().then(response => {
    response
  }));
  //display_uploads(get_subscriptions());

}

function updateSigninStatus(isSignedIn) {
  setSigninStatus();
  console.log("inside updateSigninStatus");
}








/////////////////////
////Additions made///
/////////////////////





async function get_subscriptions(token) {
  var rq = {
    part: 'id,contentDetails,subscriberSnippet,snippet',
    mine: true,
    maxResults: 50
  };
  if (token) { // If we got a token from previous call
    rq.pageToken = token; // .. attach it to the new request
  }
  var request = gapi.client.youtube.subscriptions.list(rq);
  // the response.execute is a promise function (like how .then works)
  var uploads = []
  uploads = await request.then(response => { //API ref for navigating channel: https://developers.google.com/youtube/v3/docs/channels
    ///
    //clean up and remove the .result
    ///
    var uploads2 = [];
    for (var i = 0; i < response.result.items.length; i++) {
      var cid = response.result.items[i].snippet.resourceId.channelId; //we obtain the channel id
      uploadsInAChannel = get_channel_uploads(cid);
      uploads2 = uploads2.concat(uploadsInAChannel);
    }
    var next = response.nextPageToken; // get token for next page
    console.log(uploads2);
    if (next) { // if has next
      get_subscriptions(next); // recurse with the new token
    }
    return uploads2;
  });

  var uploadsFINAL = [];
  Promise.all(uploads)
    .then(response => {
      for (var i = 0; i < uploads.length; i++) {
        uploadsFINAL = uploadsFINAL.concat(response[i]);
      }
      display_uploads(uploadsFINAL);
    });
}

function get_channel_uploads(cid) { // input it here
  var request = gapi.client.youtube.channels.list({
    part: 'snippet,contentDetails,statistics',
    id: cid
  }); //the request now has that specific channel's data
  return request.then(response => {
    var channels = response.result.items;
    if (channels.length == 0) {} else {
      return get_uploads(channels[0].contentDetails.relatedPlaylists.uploads);
    }
  });
}


function get_uploads(pid) {
  var rq = {
    part: 'snippet,contentDetails',
    playlistId: pid, //Youtube saves uploads of a channel by playlist
    maxResults: 50
  };
  //var request = gapi.client.youtube.playlistItems.list(rq);
  return gapi.client.youtube.playlistItems.list(rq).then(response => {
    var uploadsInAChannel2 = [];
    var requestUploads = response.result.items;
    for (var i = 0; i < requestUploads.length; i++) { //to get the entire upload playlist
      var itm = requestUploads[i];
      // now inside the video resources. Api ref: https://developers.google.com/youtube/v3/docs/videos#snippet.publishedAt
      var thumb = itm.snippet.thumbnails.medium;
      // might wanna shift the strings to display_uploads()
      var link = "<a href='https://www.youtube.com/watch?v=" + itm.snippet.resourceId.videoId + "' target='_blank'>";
      var img = "<img src='" + thumb.url + "' width=" + thumb.width + " height=" + thumb.height + ">";
      var end_link = "</a>";
      var dateTime = itm.snippet.publishedAt

      var uploadDetails = {
        'link': link,
        'img': img,
        'end_link': end_link,
        'dateTime': dateTime
      }
      //$('#results').append(link + img + end_link);
      uploadsInAChannel2.push(uploadDetails);
      //console.log("request execute inside request execute inside get_uploads" + uploads);
    }
    console.log(uploadsInAChannel2);
    return uploadsInAChannel2;
  });
}


function display_uploads(uploads) {
  uploads.sort(function(a, b) {
    return (a.dateTime < b.dateTime) ? -1 : ((a.dateTime > b.dateTime) ? 1 : 0);
  }).reverse();

  for (var i = 0; i < uploads.length; i++) {
    $('#results').append(uploads[i].link + uploads[i].img + uploads[i].end_link);
  }
}
