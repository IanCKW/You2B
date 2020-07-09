var pendingToRem = [];

function need_buttons(){
    if(pendingToRem.length === 0){
        console.log(document.getElementById("commit"));
        document.getElementById("commit").style.display='none';
        document.getElementById("undo").style.display='none';
    }
    else{
        document.getElementById("commit").style.display='unset';
        document.getElementById("undo").style.display='unset';
    }
}

$(document).on('click','button.removeButton',function(){
    $(this).parent().parent()[0].style.display="none";
    var videoId = $(this).attr("id");
    pendingToRem.push(videoId);
    need_buttons();
});

$(document).on('click','button#commit',function(){
    var entry = {
        message : pendingToRem,
    };

    pendingToRem=[];
    need_buttons();

    fetch(`${window.origin}/del-vid`,{
        method:"POST",
        credentials: "include",
        body: JSON.stringify(entry),
        cache: "no-cache",
        headers: new Headers({
            "content-type":"application/json"
        })
    })
});
$(document).on('click','button#undo',function(){
    if(pendingToRem.length>0){
        var allVideos = Array.from($(".videoDetails"));
        console.log(allVideos[0]);
        allVideos.forEach(video=>{video.style.display="unset"});
    }
    pendingToRem=[];
    need_buttons();
});






























//document.getElementById("testButton").addEventListener("click",testFunc);
//
//function testFunc(){
//    var entry = {
//        message : "hello",
//    };
//
//    fetch(`${window.origin}/create-entry`,{
//        method:"POST",
//        credentials: "include",
//        body: JSON.stringify(entry),
//        cache: "no-cache",
//        headers: new Headers({
//            "content-type":"application/json"
//        })
//    })
//    .then(response=> {
//        if(response.status !== 200){
//            console.log("Response status is not 200. It is :" + response.status);
//            return;
//        }
//        response.json()
//        .then(data=>{
//            console.log(data);
//        });
//    });
//
//}
