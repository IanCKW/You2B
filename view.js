
//Handling of DOM///

export function display_uploads(uploads) {
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
