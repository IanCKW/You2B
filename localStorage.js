
// Dealing with localStorage //

export function check_localStorage(userId){
  return localStorage.getItem(userId) !== null;
}

export function remove_from_localStorage(removedId){
  var currentUploads = JSON.parse(localStorage.getItem(userId));
  var afterRemUploads = currentUploads.filter(item => item.id !== removedId);
  localStorage.setItem(userId,JSON.stringify(afterRemUploads));
}

export function set_localStorage_nested_uploads(userId,nestedUploads){
  //Despite concating in iter_subscribed_channels, uploadsbychannel is still nested
  var uploads = [];
  for (var i = 0; i < nestedUploads.length; i++) {
    uploads = uploads.concat(nestedUploads[i]);
  }
  set_localStorage_uploads(userId, uploads);
  return get_localStorage_uploads(userId)
}

export function set_localStorage_uploads(userId, uploads){
  localStorage.setItem(userId,JSON.stringify(uploads));
}

export function get_localStorage_uploads(userId){
  return JSON.parse(localStorage.getItem(userId));
}
