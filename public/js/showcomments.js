$('.see-comments').click(function(){
	let $this = $(this);
	let messageid = $($this).data('messageid')
	let commentMessageId = $('.hidden').data('box')
	console.log(commentMessageId)

	let message = $('#newMessage').data('message')
	console.log(message)
	console.log(message.comments) //ha ures - undefined

	if($this.hasClass('see-comments')) {
		$this.text('Hide comments')
		$(`#${messageid+1}`).removeClass('hidden').addClass('show')
	} else {
		$this.text('See comments');
		$('.show').removeClass('show').addClass('hidden')
	}
	$this.toggleClass('see-comments');
})

