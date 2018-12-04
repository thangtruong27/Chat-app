const express = require('express');
const path = require('path');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyReq = require('body-parser');
const port = 3000;

var msgs = [];

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');

app.use(bodyReq.urlencoded({ extended: false }));

/*  Route   */
app.get('/', function (req, res) {
    res.render('index');
});

app.post('/message', function (req, res) {
    res.render('message', { nickname: req.body.nickname });
});

/*  Connection Handle  */
io.on('connection', function (socket) {
    console.log('A user connected');    
    io.to(socket.id).emit('add participants messages', msgs);

    socket.on('new message', function (msg) {
        socket.emit('new message', msg);
        socket.broadcast.emit('new message', msg);
        msgs.push(msg);
    });

    socket.on('typing', function (nickname) {
        socket.broadcast.emit('typing', nickname);
    });
    socket.on('stop typing', function (nickname) {
        socket.broadcast.emit('stop typing', nickname);
    });

    socket.on('disconnect', () => console.log('User disconnected'));
});


http.listen(port, () => console.log("Server is running on port 3000"));

