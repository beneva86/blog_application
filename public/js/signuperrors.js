$(document).ready(function() {

$('#login-button').on('click', function(){
	let username= $('#usernameLogin').val()
	let password= $('#passwordLogin').val()

	if (username == '' || password == '') {
		swal("Oops!", "Please, fill all fields", "error")
	} else {
 		$.post('/login', {username:username, password: password}, (data) => {

 			if(data.falseUsername !== undefined){
				swal("Oops!", "There is no account with this username. Please, try again!", "error");
			} else if (data.falsePassword !== undefined) {
				swal("Oops!", "Your password is incorrect. Please, try again!","error")
			}
				swal("Hurray", data.welcomeMessage, "success")
				.then(function(){
					window.location.href = '/profile'
				})
		})
 	}
})	

$('#signup-button').on('click', function(){
	let username= $('#username').val()
	let email= $('#email').val()
	let password= $('#password').val()
	let password_confirmed= $('#password-confirmed').val()

	if (username == '' || email == '' || password == '' || password_confirmed == '') {
		swal("Oops!", "Please, fill all fields", "error")
	} else if (email.indexOf('@') === -1 || email.indexOf('.') === -1 || email.indexOf('@') > email.indexOf('.')) {
	 	$('#email-mark').text('Your email *')
	 	$('#email-feedback').html('<h5 style="color:red"> Invalid email address </h5>')
	} 
	else if (password.length < 8) {
		$('#password-character').html('<h5 style="color:red"> Password must be at least 8 characters </h5>')
	}
 	else if (password !== password_confirmed) {
 		$('#email-mark').text('Your email')
 		$('#email-feedback').html('<h5></h5>')
 		$('#password-mark').text('Confirm your password *')
	 	$('#password-notmatch').html('<h5 style="color:red"> Passwords do not match </h5>')
 	} 
 	else {
 		$.post('/signup', {username: username, email: email, password: password}, (data) => {
 			if(data.message_username !== undefined) {
				swal("Oops!", data.message_username, "error");
 			} 
 			else if (data.message_email !== undefined) {
 				swal("Oops!", data.message_email, "error");
 			} 	
 				swal("Hurray", data.message_signup, "success");
 				$('#username').val('')
 				$('#email').val('')
 				$('#password').val('')
 				$('#password-confirmed').val('')
 				$('#password-mark').text('Confirm your password')
	 			$('#password-notmatch').html('<h5></h5>')
	 			$('#password-character').html('<h5></h5>')
 		})
 	}
 })
})
