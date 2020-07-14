var removeStack = [];

$(document).ready(function() {
  var entry = {
    message: "message",
  };

  fetch(`${window.origin}/obtain-video-data`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(entry),
      cache: "no-cache",
      headers: new Headers({
        "content-type": "application/json"
      })
    })
    .then(function(response) {
      response.json()
        .then(function(data) {
        // setting the state
          state.monthlyData = data["monthly_data"];
          state.userDatetime = data["user_datetime"];
          data["new_user"] ? state.userDatetime = data["month_by_index"][0]: state.userDatetime = data["user_datetime"] ;
          state.currentYearMonth = state.userDatetime.slice(0, 7);
          state.numMonths = Object.keys(data["monthly_data"]).length;
          state.monthByIndex = data["month_by_index"] // key: index, value: month
          state.indexByMonth = data["index_by_month"]// key: month, value: index
          state.currentMonthIndex= state.indexByMonth[state.currentYearMonth];
          paginate();
        })
    })
});

//state contains all variables needed for pagination. It changes based on which page you're on
var state ={
    monthlyData: {},
    userDatetime: "",
    currentYearMonth: "",

    // for buttons
    numMonths: 0,
    monthByIndex:{},
    indexByMonth:{},
    currentMonthIndex:0,
    numButtons: 5,

}

function paginate() {
    create_buttons();
    display_month();
}

function create_buttons() {
    var buttons = $('.pageButtons');
    var numButtons = state.numButtons;
    var currentMonthIndex = state.currentMonthIndex;
    var numMonths = state.numMonths;

    var maxLeft = (currentMonthIndex - Math.floor(numButtons / 2));
    var maxRight = (currentMonthIndex +1+  Math.floor(numButtons / 2));

    if (maxLeft < 1) {
        maxLeft = 0;
        maxRight = numButtons;
    }
    if (maxRight > numMonths) {
        maxLeft = numMonths - (numButtons - 1);
        if (maxLeft < 1){
            maxLeft = 0;
        }
        maxRight = numMonths;
    }
    for (var i=maxLeft; i<maxRight; i++ ){
        var yearMonth = state.monthByIndex[i];
        var buttonDetails ='<button class="pageButton" id='+yearMonth+'>'+ yearMonth +'</button>';
        buttons.append(buttonDetails);
    }

}

$(document).on('click', 'button.pageButton', function(){
    $(".results").empty();
    $(".pageButtons").empty();
    var prev = state.currentYearMonth //for video removal

    var yearMonth = this.id;
    state.currentYearMonth = yearMonth;
    state.currentMonthIndex = state.indexByMonth[yearMonth];

    // removing all the removed videos from the page the user was at prior to clicking the btn
    if(removeStack!==[]){
        var prevPage = state.monthlyData[prev];
        var result = [];
        for (var i=0;i<prevPage.length;i++){
            if(!removeStack.includes(prevPage[i]["id"])){
                result.push(prevPage[i])
            }
        }
        removeStack = [];
        state.monthlyData[prev] = result;
    }

    need_button(); // remove the undo button
    paginate();

});

function display_month() {
  monthData = state.monthlyData[state.currentYearMonth];
  for (var i = 0; i < monthData.length; i++) {
    var video =
      '<div id=' + monthData[i]["id"] + ' class="videoDetails"> ' +
        '<a href=' + monthData[i]["link"] + ' target="_blank"> ' +
            '<img class="thumb" src=' + monthData[i]["img"] + ' width="160" height="90">' +
        '</a>' +
        '<div class="buttonContainer">' +
            '<button class="removeButton">-</button>' +
        '</div>' +
      '</div>';
    $('.results').append(video);
  }
}

function need_button() {
  if (removeStack.length === 0) {
    document.getElementById("undo").style.display = 'none';
  } else {
    document.getElementById("undo").style.display = 'unset';
  }
}

$(document).on('click', 'button.removeButton', function() {
  $(this).parent().parent()[0].style.display = "none";
  var videoId = $(this).parent().parent().attr("id");
  removeStack.push(videoId);
  need_button();

  var entry = {
    message: videoId,
  };

  fetch(`${window.origin}/del-vid`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(entry),
    cache: "no-cache",
    headers: new Headers({
      "content-type": "application/json"
    })
  })
});

$(document).on('click', 'button#undo', function() {
  if (removeStack.length > 0) {
    var videoId = removeStack.pop()
    document.getElementById(videoId).style.display = 'unset';

    var entry = {
      message: videoId,
    };

    fetch(`${window.origin}/undel-vid`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(entry),
      cache: "no-cache",
      headers: new Headers({
        "content-type": "application/json"
      })
    })
  }
  need_button();
});
