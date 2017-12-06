$(document).ready(function() {
	$('#newMessage').hide()
	$('.replyCont').hide()

// render a new div to write comment (to the 'clicked' message) 
	$('.replyButton').on('click', function(){
		let renderedBox = $(this).data("box");
		$(`#${renderedBox}`).show()
		$(`#${renderedBox}`).children().children().children().val('')
})

//send a new comment and show the sent comment in a new div
	$('.sendComment').on('click', function(){
		let user = $('h3').data("user"); 
		let messageId = $(this).data("box"); // unique ID of the send comment button
		let comment = $(this).siblings("textarea").val()	// value of the textarea
		let commentDivId = messageId+'comment' // unique ID of the new div with the comment which sent
		$('.replyCont').hide() // hide the textarea
		$(`#${commentDivId}`).show() // show a new div with the comment

		$(`#${commentDivId}`).children().children().append(`<div class="panel-heading" id="${messageId+1}"> ${user.username} </div>`).append(`<div class="panel-body"> ${comment} </div><br>`)

		let newCommentInput = {
			body: comment,
			messageId: messageId
		}
		
	$.post('/comment_forum_hungary', newCommentInput, function(data) {
		$(this).siblings("textarea").val('') 
		let user = JSON.stringify(data.user)
		let dateAndTime = data.newComment.createdAt.substring(0,10) + " | " + data.newComment.createdAt.substring(11,16)
		$(`#${messageId+1}`).append(`<span style="float:right"> ${dateAndTime} </span>`)
	     });
        })
	})

// send a new message and show the sent message in a new div
function sendMessage() {
    let message= document.getElementById("messageHungary").value;
    let topic= document.getElementById("topic").innerHTML;
    // console.log(topic)
	document.getElementById("newMessageContent").innerHTML = message;
	let newMessage = {
		content: message,
		topic: topic
	}

	// post request with the new message
$.post('/message_forum_hungary', newMessage, function(response) {
	$('#newMessage').show();
	$('#messageHungary').val('')
	let dateAndTime = response.message.createdAt.substring(0,10) + " | " + response.message.createdAt.substring(11,16)
	document.getElementById("time").innerHTML = dateAndTime
})
}

// close the textarea when the user clicks on the close button (X)
function closeTheComment() {
	$('.replyCont').hide()
}


