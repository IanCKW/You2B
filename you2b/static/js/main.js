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
          document.getElementById("loader-container").remove();
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
    //getting all the necessary variables
    var buttons = $('.pageButtons');
    var numButtons = state.numButtons;
    var currentMonthIndex = state.currentMonthIndex;
    var numMonths = state.numMonths;
    //logic of which buttons to display
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
    //displaying the buttons
    for (var i=maxLeft; i<maxRight; i++ ){
        //"First" button
        if(i !== 0 && i === maxLeft){
            var yearMonth = state.monthByIndex[0];
            var bD ='<button class="page" id='+yearMonth+'>'+ 'First' +'</button>';
            buttons.append(bD);
        }
        var yearMonth = state.monthByIndex[i];
        if (i === currentMonthIndex){
            var buttonDetails ='<button class=" currentPage" id='+yearMonth+'>'+ yearMonth +'</button>';
        }
        else{
            var buttonDetails ='<button class="page" id='+yearMonth+'>'+ yearMonth +'</button>';
        }
        buttons.append(buttonDetails);
    }
    //one year from now button
    if(state.monthByIndex[currentMonthIndex + 12]){
        var yearMonth = state.monthByIndex[currentMonthIndex + 12];
        var buttonDetails ='<button class="page" id='+yearMonth+'>'+ yearMonth +'</button>';
        buttons.append("<span>...</span>" + buttonDetails);
    }

}

$(document).on('click', 'button.page', function(){
    console.log(window.origin);
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
  $('.monthHeader').html(monthInLetters(state.currentYearMonth));
  for (var i = 0; i < monthData.length; i++) {
    var video =
      '<div id=' + monthData[i]["id"] + ' class="videoDetails"> ' +
        '<a href=' + monthData[i]["link"] + ' target="_blank"> ' +
            '<img class="thumb" src=' + monthData[i]["img"] + '>' +
        '</a>' +
        '<div class="underImg">' +
            '<span class="textInfo">' +
                '<div class="title">'+monthData[i]["video_title"]+'</div>' +
                '<div class="channel">'+monthData[i]["channel_title"]+'</div>' +
                '<div class="date">'+date(monthData[i]["datetime"])+'</div>' +
            '</span>' +
            '<button class="removeButton">-</button>' +
        '</div>' +
      '</div>';
    $('.results').append(video);
  }
}

var monthDict = {
    "01": "JANUARY", "02": "FEBRUARY", "03": "MARCH","04":"APRIL","05":"MAY","06":"JUNE","07":"JULY",
    "08":"AUGUST","09":"SEPTEMBER","10":"OCTOBER","11":"NOVEMBER","12":"DECEMBER",
}

var monthDictShort = {
    "01": "Jan", "02": "Feb", "03": "Mar","04":"Apr","05":"May","06":"Jun","07":"Jul",
    "08":"Aug","09":"Sep","10":"Oct","11":"Nov","12":"Dec",
}

function monthInLetters(yearMonth){
    var year = yearMonth.slice(0,4);
    var month = yearMonth.slice(5,7);
    var monthRes = monthDict[month];
    return monthRes +" "+ year;
}

function date(datetime){
    var month = datetime.slice(5,7);
    if (datetime.slice(8,9)==="0"){var day = datetime.slice(9,10);}
    else {var day = datetime.slice(8,10);}
    var monthRes = monthDictShort[month];
    return day + " " + monthRes;
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

$(document).on('click', 'input#undo', function() {
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


//modal

document.getElementById('profile-pic').addEventListener("click", function() {
	document.querySelector('.bg-modal').style.display = "flex";
});

document.querySelector('.close').addEventListener("click", function() {
	document.querySelector('.bg-modal').style.display = "none";
});