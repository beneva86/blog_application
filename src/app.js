const Sequelize = require('sequelize') 
const express = require('express')
const bodyParser = require('body-parser')
const session = require('express-session')
const SequelizeStore = require('connect-session-sequelize')(session.Store);

// BCRYPT
const bcrypt = require('bcrypt');
const saltRounds = 10;

// CONFIG dependencies
const app = express()

// connect to the database
const sequelize = new Sequelize('blog_application',process.env.POSTGRES_USER,null,{
  host: 'localhost',
  dialect: 'postgres',
  storage: './session.postgres' 
})

app.use(express.static('public'))

app.set('views','views')
app.set('view engine','pug')

app.use(bodyParser.urlencoded({extended: true}))

app.use(session({
  secret: "safe",         
  saveUnitialized: true,  
  resave: false,         
  store: new SequelizeStore({
    db: sequelize,  
    checkExpirationInterval: 15 * 60 * 1000, 
    expiration: 24 * 60 * 60 * 1000 
  })
}))

//MODELS DEFINITION
const User = sequelize.define('users', {
	username: {
		type: Sequelize.STRING,
		unique: true
	},
	email: {
		type: Sequelize.STRING,
    	unique: true
	},
	password: {
		type: Sequelize.STRING
	},
})

const Message = sequelize.define('messages', {
	body: {
		type: Sequelize.TEXT 
	},
	topic: {
		type: Sequelize.TEXT
	}
})

const Comment = sequelize.define('comments', {
	body: {
		type: Sequelize.TEXT 
	}
})

// TABLES RELATIONSHIP/ASSOCIATION 
User.hasMany(Message)
Message.belongsTo(User)	// userId in messages table
Comment.belongsTo(Message) // messageId in comment table
Comment.belongsTo(User) // userId in comment table
User.hasMany(Comment)
Message.hasMany(Comment)

//----------------ROUTES----------------

//---------------ROUTE: HOME-----------------
app.get('/', function(req, res){
	let user = req.session.user
	let message = req.query.message
	res.render('home', {user: user, message: message})
})	

//------------ROUTE: CHECKING IF FORM INPUT USERDATA MATCHES DATABASE ENTRY. IF YES, ASSIGN SESSION TO USER.
app.post('/login', function (request, response) {
	let username = request.body.username
	let password = request.body.password
	console.log('username' + " " + username)
	console.log('password' + " " + password)

	// data validation 
	if(request.body.username.length === 0) {
    response.redirect(`/?message=` + encodeURIComponent('please fill out your email address'))
    return;
	} else if(request.body.password.length === 0) {
    response.redirect(`/?message=` + encodeURIComponent('please fill out your password'))
    return;
	}

	User.findOne({
		where: {
			username: username
		}
	}).then( (user) => {
		// if there is a match with the database
		if(user!== null) {
			bcrypt.compare(password, user.password, function(err, res) {
				//if the username and password match with the database
				if (res) {
					request.session.user = user;
					response.send({welcomeMessage:"You're logged in now, please click here to go to your profile"})
				// if the password doesn't match with the database
				} else {
					response.send({falsePassword:true})
		} 
	})
	// if there is no user with the username
	} else {
		response.send({falseUsername: true})		
	}
})
	.catch(function(err) {
    	console.log(err);
	})
});

//--------------ROUTE: SHOW THE PROFILE PAGE
app.get('/profile', (req,res) => {
	const username = req.session.user.username
	const userId = req.session.user.id

	User.findAll({
	}).then(function(users){
	User.findOne({
		where: {
			username: username
		}
	}).then( (user) => {
		if(user!== null) {
			Message.findAll({
				where: {
				userId: user.id
				},
				include: [{
					model: Comment
				}]
			})
			.then(function(messages) {
				req.session.user = user;
				let commentsList = []
				for(let i=0; i<messages.length; i++) {
					commentsList.push(JSON.stringify(messages[i].comments))
				}
				res.render('profile', {user: user, messages: messages, userList: users})
			})  
		} else {
			res.redirect('/?messageSessionExpired=' + encodeURIComponent('Your session is expired. Please,log in again!'))
		}
	})
	}).catch(function(err) {
    	console.log(err);
	})
})

//--------------ROUTE: CREATING NEW USER IN SIGNUP-------------
app.get('/loginSignup', (req, res) => {
	const message = req.query.message
	res.render('loginSignup');
})

// post for signup
app.post('/signup', (req,res) => {

	let username = req.body.username
	let email = req.body.email
	let password = req.body.password

	// data validation
	if(req.body.username.length === 0) {
	    response.redirect(`/?message=` + encodeURIComponent('please fill out your email address'))
	    return;
	}
	if(req.body.email.length === 0) {
	    response.redirect(`/?message=` + encodeURIComponent('please fill out your password'))
	    return;
	}
	if(req.body.password.length === 0) {
	    response.redirect(`/?message=` + encodeURIComponent('please fill out your password'))
	    return;
	}

	User.findOne({
		where: {
			username: username
		}
	}).then((returnUser) =>{
		if(returnUser !== null) {
			res.send({message_username: "This username is already in use. Please, select another username!"})
		} else {
		User.findOne({
			where: {
				email: email
			}
		}).then((returnEmail)=> {
		if(returnEmail!==null) {
			res.send({message_email: "This email address is already in use"})
		} else {
			bcrypt.hash(password, saltRounds).then(function(hash) {
				return hash 
			}).then ((hash) => { 
				User.create({
					username: username,
					email: email,
					password: hash
			}).then( (user) => {
				// console.log(user)
				res.send({message_signup:'Your account is successfully created. You can log in now!', user: user})
			})
			})
		}
	})
	}
	})
	.catch(function(err) {
    console.log(err);
    })
})

//-------------ROUTE: logout---------------
app.get('/logout', (req,res)=> {
	req.session.destroy((error)=> {
		if(error) {
			throw error;
		}
	res.redirect('/?message=' + encodeURIComponent('Successfully logged out'))
	})
})

//-------------ROUTE: thailand-------------
app.get('/thailand', (req,res) => {
	const user = req.session.user
	res.render('thailand', {user:user})
})

//-------ROUTE: send along all messages to the client side
app.get('/thailand_forum', (req, res) => {
	const user = req.session.user

		User.findAll({
		}).then(function(users){
		Message.findAll({
		where: {
			topic: 'What do you think about Thailand?'
		},
		include: [{
			model: User
		},
		{
			model: Comment
		}]
	}).then(function(messages) {
			res.render('thailand_forum', {user:user, messages: messages, userList: users})
		})
	})	
})

//-------------ROUTE: post message (forum Thailand)
app.post('/message_forum_thailand', (req,res) => {
	const user = req.session.user
	const message = req.body.content
	const topic = req.body.topic

	if (user === undefined) {
		res.redirect('/?message=' + encodeURIComponent('Please log in to write a message'))
	} else {
		User.findOne({
			where: {
				username: user.username
			}
		})
		.then(function(returnUser) {
			return returnUser.createMessage({
				body: message,
				topic: topic
			})
		})
		.then(newMessage => {
			res.send({message: newMessage.dataValues})
		}).catch(function(err) {
    console.log(err);
    })
	}
})

//-------------ROUTE: post comment (forum Thailand)
app.post('/comment_forum_thailand', (req,res) => {
	const user = req.session.user
	const comment = req.body.body
	const messageId = req.body.messageId

	User.findOne({
		where: {
			username: user.username
		}
	})
	.then(function(userLoggedIn) {
		return userLoggedIn.createComment({
			body: comment,
			messageId: messageId,
			userId: user.id
		})
	})
	.then(newComment => {
		console.log(newComment)
		res.send({newComment: newComment.dataValues, user:user})
	})
})

//---------------ROUTE: QUESTIONS ABOUT THAILAND-----------------

//-------ROUTE: send along all messages to the client side
app.get('/thailand_questions', (req, res) => {
	const user = req.session.user

		User.findAll({
		}).then(function(users){
		Message.findAll({
		where: {
			topic: 'Questions about Thailand'
		},
		include: [{
			model: User
		},
		{
			model: Comment
		}]
		}).then(function(messages) {
			res.render('thailand_questions', {user:user, messages: messages, userList: users})
		})	
		})
})

//---------------ROUTE: POST FOR THE QUESTION ABOUT THAILAND------------------
app.post('/message_question_thailand', (req,res) => {
	const user = req.session.user
	const message = req.body.content
	const topic = req.body.topic

	if (user === undefined) {
		res.redirect('/?message=' + encodeURIComponent('Please log in to write a message'))
	} else {
		User.findOne({
			where: {
				username: user.username
			}
		})
		.then(function(returnUser) {
			return returnUser.createMessage({
				body: message,
				topic: topic
			})
		})
		.then(newMessage => {
			res.send({message: newMessage.dataValues})
		}).catch(function(err) {
    console.log(err);
    })
	}
})

//-------------ROUTE: post comment (questions Thailand)
app.post('/comment_questions_thailand', (req,res) => {
	const user = req.session.user
	const comment = req.body.body
	const messageId = req.body.messageId

	User.findOne({
		where: {
			username: user.username
		}
	})
	.then(function(userLoggedIn) {
		return userLoggedIn.createComment({
			body: comment,
			messageId: messageId,
			userId: user.id
		})
	})
	.then(newComment => {
		res.send({newComment: newComment.dataValues, user:user})
	})
})

//-------------ROUTE: hungary-------------
app.get('/hungary', (req,res) => {
	const user = req.session.user
	res.render('hungary', {user:user})
})

//-------ROUTE: send along all messages to the client side
app.get('/hungary_forum', (req, res) => {
	const user = req.session.user

		User.findAll({
		}).then(function(users){
		Message.findAll({
		where: {
			topic: 'What do you think about Hungary?'
		},
		include: [{
			model: User
		},
		{
			model: Comment
		}]
		}).then(function(messages) {
			console.log('MESSAGES HUNGARY ARE: ' + messages)
			res.render('hungary_forum', {user:user, messages: messages, userList: users})
		})	
		})
})

//-------------ROUTE: post message (forum Hungary)
app.post('/message_forum_hungary', (req,res) => {
	const user = req.session.user
	const message = req.body.content
	const topic = req.body.topic

	if (user === undefined) {
		res.redirect('/?message=' + encodeURIComponent('Please log in to write a message'))
	} else {
		User.findOne({
			where: {
				username: user.username
			}
		})
		.then(function(returnUser) {
			return returnUser.createMessage({
				body: message,
				topic: topic
			})
		})
		.then(newMessage => {
			res.send({message: newMessage.dataValues})
		}).catch(function(err) {
    console.log(err);
    })
	}
})

//-------------ROUTE: post comment (forum Hungary)
app.post('/comment_forum_hungary', (req,res) => {
	const user = req.session.user
	const comment = req.body.body
	const messageId = req.body.messageId

	User.findOne({
		where: {
			username: user.username
		}
	})
	.then(function(userLoggedIn) {
		return userLoggedIn.createComment({
			body: comment,
			messageId: messageId,
			userId: user.id
		})
	})
	.then(newComment => {
		console.log(newComment)
		res.send({newComment: newComment.dataValues, user:user})
	})
})

//---------------ROUTE: QUESTIONS ABOUT HUNGARY-----------------
//-------ROUTE: send along all messages to the client side
app.get('/hungary_questions', (req, res) => {
	const user = req.session.user

		User.findAll({
		}).then(function(users){
		Message.findAll({
		where: {
			topic: 'Questions about Hungary'
		},
		include: [{
			model: User
		},
		{
			model: Comment
		}]
		}).then(function(messages) {
			res.render('hungary_questions', {user:user, messages: messages, userList: users})
		})	
		})
})

//---------------ROUTE: POST FOR THE QUESTION ABOUT HUNGARY------------------
app.post('/message_question_hungary', (req,res) => {
	const user = req.session.user
	const message = req.body.content
	const topic = req.body.topic

	if (user === undefined) {
		res.redirect('/?message=' + encodeURIComponent('Please log in to write a message'))
	} else {
		User.findOne({
			where: {
				username: user.username
			}
		})
		.then(function(returnUser) {
			return returnUser.createMessage({
				body: message,
				topic: topic
			})
		})
		.then(newMessage => {
			res.send({message: newMessage.dataValues})
		}).catch(function(err) {
    console.log(err);
    })
	}
})

//-------------ROUTE: post comment (questions Hungary)
app.post('/comment_questions_hungary', (req,res) => {
	const user = req.session.user
	const comment = req.body.body
	const messageId = req.body.messageId

	User.findOne({
		where: {
			username: user.username
		}
	})
	.then(function(userLoggedIn) {
		return userLoggedIn.createComment({
			body: comment,
			messageId: messageId,
			userId: user.id
		})
	})
	.then(newComment => {
		res.send({newComment: newComment.dataValues, user:user})
	})
})

sequelize.sync()

app.listen(3000, function(){
  console.log("App listening on port 3000")
})


