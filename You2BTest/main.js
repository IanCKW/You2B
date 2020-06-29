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
    'apiKey': 'AIzaSyBpRkYjses5N_bF5KKrVjodxefxXCiV_ew',
    'discoveryDocs': [discoveryUrl],
    'clientId': '127786091019-jc7mc59esh5crvtup068hqdhj2ga43aj.apps.googleusercontent.com',
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
      userId = userId0;
      if(localStorage.getItem(userId) === null ){
        // var uploads = get_subscriptions();
        // Promise.all([uploads])
        //   .then(([uploads]) =>{
        //     display_uploads(uploads);
        //   });
        get_subscriptions();
      }
      else{
        console.log(userId);
        var uploads0 = localStorage.getItem(userId);
        console.log(uploads0);
        var uploads = JSON.parse(uploads0);
        display_uploads(uploads);
      }
    });



}




async function get_subscriptions(token) {
  var rq = {
    part: 'id,contentDetails,subscriberSnippet,snippet',
    mine: true,
    maxResults: 10
  };
  if (token) { // If we got a token from previous call
    rq.pageToken = token; // .. attach it to the new request
  }

  var request = gapi.client.youtube.subscriptions.list(rq);
  // the response.execute is a promise function (like how .then works)
  //var uploads = []
  uploads = await request.then(response => { //API ref for navigating channel: https://developers.google.com/youtube/v3/docs/channels
    //console.log(response.result.id);
    var uploads2 = [];
    for (var i = 0; i < response.result.items.length; i++) {
      var cid = response.result.items[i].snippet.resourceId.channelId; //we obtain the channel id
      uploadsInAChannel = get_channel_uploads(cid);
      uploads2 = uploads2.concat(uploadsInAChannel);
    }
    var next = response.nextPageToken; // get token for next page
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
      localStorage.setItem(userId,JSON.stringify(uploadsFINAL));
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
    maxResults: 10
  };
  var request = gapi.client.youtube.playlistItems.list(rq);
  return gapi.client.youtube.playlistItems.list(rq).then(response => {
    var uploadsInAChannel2 = [];
    var requestUploads = response.result.items;
    for (var i = 0; i < requestUploads.length; i++) { //to get the entire upload playlist
      // send a video request for views and duration
      var itm = requestUploads[i];
      var snippet = itm.snippet;
      var thumb = snippet.thumbnails.medium;
      var id = snippet.resourceId.videoId ;
      var img = "<img src='" + thumb.url + "' width=" + 210 + " height=" + 118 + ">";

      var dateTime = snippet.publishedAt;

      var title = snippet.title;
      var channelName = snippet.channelTitle;
      //var views = itm.statistics.viewCount;
      // var duration = itm.contentDetails.duration;
      // console.log(duration);

      var uploadDetails = {
        'id': id,
        'img': img,
        'dateTime': dateTime,

        'title': title,
        'channelName': channelName,
        //'views': views
      }
      //console.log(views);
      uploadsInAChannel2.push(uploadDetails);
    }
    return uploadsInAChannel2;
  });
}


function display_uploads(uploads) {
  uploads.sort(function(a, b) {
    return (a.dateTime < b.dateTime) ? -1 : ((a.dateTime > b.dateTime) ? 1 : 0);
  }).reverse();

  for (var i = 0; i < uploads.length; i++) {
    var link = "<a href='https://www.youtube.com/watch?v=" + uploads[i].id + "' target='_blank'>"
    var video = link + uploads[i].img + "</a>";
    var button = "<div class='buttonContainer'> <button id="+uploads[i].id+" class='removeButton'>-</button> </div>";
    var title =  "<div class ='title'>" + uploads[i].title + "</div>";
    var buttonAndTitle = "<div class='buttonAndTitle'>" + title + button + "</div>";
    var channelName = "<div class ='channelName'>" + uploads[i].channelName + "</div>";
    //var views = "<div class ='views'>" + uploads[i].views + "</div>";
    $('#results').append("<div class = 'videoDetails'>"  + video + buttonAndTitle + channelName + "</div>");
  }

  //$(document).on allows for appended buttons after the script has run
  $(document).on('click','button.removeButton',function(){
    $(this).parent().parent().parent().remove();
    var removedId = $(this).attr('id');
    remove_from_uploads(removedId);
  });
}

function remove_from_uploads(removedId){
  var currentUploads = JSON.parse(localStorage.getItem(userId));
  var afterRemUploads = currentUploads.filter(item => item.id !== removedId);
  localStorage.setItem(userId,JSON.stringify(afterRemUploads));

}
