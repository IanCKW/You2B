
//API use and the logic in how it is used and stored //

import {display_uploads} from '/view.js'
import {check_localStorage, remove_from_localStorage, set_localStorage_nested_uploads, set_localStorage_uploads, get_localStorage_uploads} from '/localStorage.js';
var userId='';

export async function display_logic(){
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
  if(check_localStorage(userId)){
    display_uploads(get_localStorage_uploads(userId));
  }
  else{
    get_subscriptions();
  }
}


async function get_subscriptions(token) {
  console.log(token);
  var rq = {
    part: 'id,contentDetails,subscriberSnippet,snippet',
    mine: true,
    maxResults: 5
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
      display_uploads(set_localStorage_nested_uploads(userId,uploadsByChannel));
    });
}

function iter_subscribed_channels(response){

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
    maxResults: 5
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
