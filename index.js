const express = require('express');
const app = express();
const session = require('express-session');
const request = require('request');
const path = require('path');
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const publicPath = path.join(__dirname, './client/static')
const bcrypt = require('bcrypt');
const saltRounds = 10;
var { options } = require('./server/db_connect');
app.use(express.static(publicPath));
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true }))

//defaults
const {
    PORT = 3000,
        SESS_NAME = 'sid',
        SESS_LIFETIME = 1000 * 60 * 60 * 4,
        SESS_SECRET = 'secret'

} = process.env;

//session code
app.use(session({
    name: SESS_NAME,
    secret: SESS_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: SESS_LIFETIME,
        sameSite: true
    }
}))

const redirectLogin = (req, res, next) => {
    if (!req.session.userid) {
        res.redirect('/');
    } else {
        next()
    }
}

const redirectChat = (req, res, next) => {
    if (req.session.userid) {
        res.redirect('/users');
    } else {
        next()
    }
}

app.get('/', redirectChat, function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

app.post('/', redirectChat, function(req, res) {
    const username = req.body.username1;
    const password = req.body.password1;

    //check if username and password exitst
    if (username && password) {

        //chek if the credentials exists
        options.json = { "query": "{\n  main(where: {username: {_eq: \"" + username + "\"}}) {\n    id\n    username\n       password\n   }\n}\n", "variables": null };
        request(options, (err, response, body) => {

            if (!err && response.body.data.main[0] != undefined) {
                bcrypt.compare(password, response.body.data.main[0].password, function(err, res1) {
                    // res == true
                    if (res1) {
                        req.session.userid = response.body.data.main[0].id;
                        req.session.username = response.body.data.main[0].username;
                        return res.send(JSON.stringify({ "login": true, "user": username }));
                    } else {
                        res.send(JSON.stringify({ "msg": "Incorrect credentials" }));
                    }
                });
            } else {
                res.send(JSON.stringify({ "msg": "either you have not registered or credentials are flase" }));
            }
        });

    }
});

app.get('/signup', redirectChat, function(req, res) {
    res.sendFile(__dirname + '/client/signup.html');
});
app.post('/signup', redirectChat, function(req, res) {
    const username = req.body.username1;
    const password = req.body.password1;

    //check if username and password exitst
    if (username && password) {
        bcrypt.hash(password, saltRounds, function(err, hash) {
            // Store hash in your password DB.

            //get the user from db 
            options.json = { "query": "mutation {\n  insert_main(objects: {username: \"" + username + "\", password: \"" + hash + "\"}) {\n    returning {\n      username\n      id\n    }\n  }\n}\n", "variables": null };
            request(options, (err, response, body) => {
                if (!err && response.body.errors != undefined) {

                    return res.send(JSON.stringify({ "msg": "user already exist" }));

                } else {

                    req.session.userid = response.body.data.insert_main.returning[0].id;
                    req.session.username = response.body.data.insert_main.returning[0].username;
                    return res.send(JSON.stringify({ "signup": true, "user": username }));
                }
            });
        });
    }
});

app.get('/users', redirectLogin, function(req, res) {
    res.sendFile(__dirname + '/client/users.html');
});
app.post('/users', redirectLogin, function(req, res) {

    //get the user from db and save it in user var
    options.json = { "query": "{\n  main(where: {username: {_neq: \"" + req.session.username + "\"}}) {\n    id\n    username\n  }\n}\n", "variables": null };
    request(options, (err, response, body) => {
        if (!err && response.body.errors != undefined) {

            return res.send('{"msg":"something went wrong"}');

        } else {

            res.send(response.body.data.main);
        }
    });


});


app.get('/chat', redirectLogin, function(req, res) {
    res.sendFile(__dirname + '/client/chat.html');
});
app.post('/chat', redirectLogin, function(req, res) {
    var user = [req.body.user, req.session.username];
    user.sort();
    console.log("user /char", user);
    var room = user[0] + user[1];
    console.log("room /chat", room);
    //get the user from db and save it in user var
    options.json = { "query": "{\n  chat(where: {chat_room: {_eq: \"" + room + "\"}}) {\n    message\n    user\n    time\n  }\n}\n", "variables": null };
    request(options, (err, response, body) => {
        if (!err && response.body.errors != undefined) {

            return res.send('{"msg":"something went wrong in chat"}');

        } else {

            res.send(response.body.data.chat);
        }
    });


});



app.get('/logout', redirectLogin, function(req, res) {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/chat');
        }

        res.clearCookie(SESS_NAME);
        res.redirect('/');
    });
});


//websocket code
io.on('connection', function(socket) {
    console.log('a user connected');

    socket.on('send', (params, callback) => {
        param = [params.from, params.to];
        param.sort();
        console.log("params in socket:", param[0], param[2]);

        var room = param[0] + param[1];
        console.log("room in socket", room);
        socket.join(room);

        if (params.msg) {
            console.log("send event receive ", params.msg);
            var ts = Math.round((new Date()).getTime() / 1000);
            //also add the message in db
            options.json = { "query": "mutation {\n  insert_chat(objects: {time: \"" + ts + "\", user: \"" + params.from + "\", chat_room: \"" + room + "\", message: \"" + params.msg + "\"}) {\n    returning {\n      chat_room\n      message\n      user\n      time\n      id\n    }\n  }\n}\n", "variables": null };
            request(options, (err, response, body) => {
                if (!err && response.body.errors != undefined) {


                } else {

                    console.log("something went wrong");
                }
            });

            //main code
            io.sockets.in(room).emit('receive', { "user": params.from, "message": params.msg, "time": ts });

        }

        return callback("success");
    });
});


http.listen(PORT, function() {
    console.log('listening on *:3000');
});
