var removeStack = [];

function need_button(){
    if (removeStack.length === 0) {
        document.getElementById("undo").style.display='none';
    } else {
        document.getElementById("undo").style.display='unset';
    }
}

$(document).on('click','button.removeButton',function(){
    $(this).parent().parent()[0].style.display="none";
    var videoId = $(this).parent().parent().attr("id");
    removeStack.push(videoId);
    need_button();
	
	var entry = {
        message : videoId,
    };
	
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
    if (removeStack.length > 0) {
		var videoId = removeStack.pop()
        document.getElementById(videoId).style.display='unset';
		
		var entry = {
			message : videoId,
		};
		
		fetch(`${window.origin}/undel-vid`,{
			method:"POST",
			credentials: "include",
			body: JSON.stringify(entry),
			cache: "no-cache",
			headers: new Headers({
				"content-type":"application/json"
			})
		})
    }
    need_button();
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
