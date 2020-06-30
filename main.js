// Authorisation //

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
    'apiKey': 'AIzaSyA0SYBgKPE-cTj8sGaZyGsmxiFrddtlzsQ',
    'discoveryDocs': [discoveryUrl],
    'clientId': '115032625780-i77ut1na7ausuk3dod8m0ngupptdvmvc.apps.googleusercontent.com',
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


var userId='';


async function display_logic(){
  var userIdRequest =  gapi.client.youtube.channels.list({part:'id', mine : true});
  var userId0 = await userIdRequest.then(response => {
    var body = JSON.parse(response.body);
    userId = body.items[0].id;
    return userId;
  });
  Promise.all(userId0)
    .then(response => {
      check_if_first_sign_in(userId0);
    });
}

function check_if_first_sign_in(userId){
  if(localStorage.getItem(userId) === null ){
    get_subscriptions();
  }
  else{
    display_uploads(get_localStorage_uploads(userId));
  }
}


async function get_subscriptions(token) {
  console.log(token);
  var rq = {
    part: 'id,contentDetails,subscriberSnippet,snippet',
    mine: true,
    maxResults: 10
  };
  token ? rq.pageToken = token : 0; //If we got a token from previous call .. attach it to the new request
  var uploadsByChannel = await gapi.client.youtube.subscriptions.list(rq)
    .then(response => {
      var next = response.nextPageToken; // get token for next page
      next ? get_subscriptions(next) : 0;// if has next, recurse with the new token
      return iter_subscribed_channels(response);
  });
  Promise.all(uploadsByChannel)
    .then(uploadsByChannel => {
      display_uploads(set_localStorage_nested_uploads(uploadsByChannel,userId));
    });
}

var p = 0;

function iter_subscribed_channels(response){
  p = p + 1;
  console.log(p);
  var uploads = [];
  var uploadsByChannel = [];
  for (var i = 0; i < response.result.items.length; i++) {
    var cid = response.result.items[i].snippet.resourceId.channelId;
    uploadsByChannel = get_channel_uploads(cid);
    uploads = uploads.concat(uploadsByChannel);
  }
  return uploads;
}


function get_channel_uploads(cid) {
  var request = gapi.client.youtube.channels.list({
    part: 'snippet,contentDetails,statistics',
    id: cid
  });
  return request.then(response => {
    var channels = response.result.items;
    if (channels.length == 0) {} else {
      return get_upload_data(channels[0].contentDetails.relatedPlaylists.uploads);
    }
  });
}


function get_upload_data(pid) {
  var rq = {
    part: 'snippet,contentDetails',
    playlistId: pid, //Youtube saves uploads of a channel by playlist
    maxResults: 10
  };
  var request = gapi.client.youtube.playlistItems.list(rq);
  return gapi.client.youtube.playlistItems.list(rq).then(response => {
    var uploadsByChannel = [];
    var uploadsReq = response.result.items;
    for (var i = 0; i < uploadsReq.length; i++) {
      var snippet = uploadsReq[i].snippet;
      var id = snippet.resourceId.videoId ;
      var img = snippet.thumbnails.medium.url
      var dateTime = snippet.publishedAt;
      var title = snippet.title;
      var channelName = snippet.channelTitle;

      var uploadDetails = {
        'id': id,
        'img': img,
        'dateTime': dateTime,
        'title': title,
        'channelName': channelName,
      }
      uploadsByChannel.push(uploadDetails);
    }
    return uploadsByChannel;
  });
}

// display // ???

function display_uploads(uploads) {
  uploads.sort(function(a, b) {
    return (a.dateTime < b.dateTime) ? -1 : ((a.dateTime > b.dateTime) ? 1 : 0);
  }).reverse();
  for (var i = 0; i < uploads.length; i++) {
    var link = "<a href='https://www.youtube.com/watch?v=" + uploads[i].id + "' target='_blank'>"
    var thumbnail = "<img src='" + uploads[i].img + "' width=" + 210 + " height=" + 118 + ">";
    var video = link + thumbnail + "</a>";
    var remButton = "<div class='buttonContainer'> <button id="+uploads[i].id+" class='removeButton'>-</button> </div>";
    var title =  "<div class ='title'>" + uploads[i].title + "</div>";
    var buttonAndTitle = "<div class='buttonAndTitle'>" + title + remButton + "</div>";
    var channelName = "<div class ='channelName'>" + uploads[i].channelName + "</div>";
    $('#results').append("<div class = 'videoDetails'>"  + video + buttonAndTitle + channelName + "</div>");
  }
  add_button_event_listeners();
}

// event listeners //


function add_button_event_listeners(){
  $(document).on('click','button.removeButton',function(){
    $(this).parent().parent().parent().remove();
    var removedId = $(this).attr('id');
    remove_from_localStorage(removedId);
  });
}


// setters and getters to local storage // create a new JS file for this

function remove_from_localStorage(removedId){
  var currentUploads = JSON.parse(localStorage.getItem(userId));
  var afterRemUploads = currentUploads.filter(item => item.id !== removedId);
  localStorage.setItem(userId,JSON.stringify(afterRemUploads));
}

function set_localStorage_nested_uploads(nestedUploads,userId){
  //Despite concating in iter_subscribed_channels, uploadsbychannel is still nested
  var uploads = [];
  for (var i = 0; i < nestedUploads.length; i++) {
    uploads = uploads.concat(nestedUploads[i]);
  }
  set_localStorage_uploads(uploads);
  return get_localStorage_uploads(userId)
}

function set_localStorage_uploads(uploads){
  localStorage.setItem(userId,JSON.stringify(uploads));
}

function get_localStorage_uploads(userId){
  return JSON.parse(localStorage.getItem(userId));
}
