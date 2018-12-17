const express = require('express');
const path = require('path');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyReq = require('body-parser');
const morgan = require('morgan');
const port = 3000;


app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');

app.use(bodyReq.urlencoded({ extended: false }));
app.use(morgan('dev'));

/*  Route   */
app.get('/', function (req, res) {
    res.render('index');
});
app.post('/messenger', function (req, res) {
    console.log(req.body);

    res.render('messenger', { nickname: req.body.nickname });
});

app.get('/messenger', (req, res) => {
    res.render('messenger');
});

var msgs = [];
var users = [];
/*  Connection Handle  */
io.on('connection', function (socket) {
    console.log('A user connected');
    io.to(socket.id).emit('add participants messages', msgs);
    io.to(socket.id).emit('add active users', users);

    socket.on('new active user', function (nickname) {
        users.push({
            nickname: nickname,
            socketId: socket.id
        });
        io.emit('new active user', nickname);
        console.log(users);
    });

    socket.on('new message', function (msg) {
        socket.broadcast.emit('new message', msg);
        msgs.push(msg);
        console.log(msg);
    });

    socket.on('typing', function (nickname) {
        socket.broadcast.emit('typing', nickname);
    });
    socket.on('stop typing', function (nickname) {
        socket.broadcast.emit('stop typing', nickname);
    });

    socket.on('disconnect', () => console.log('User disconnected'));
});


http.listen(port,() => console.log("Server is running on port 3000"));

