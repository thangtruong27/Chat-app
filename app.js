const express = require('express');
const path = require('path');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyReq = require('body-parser');
const morgan = require('morgan');
const port = 3000;
const fs = require('fs');


app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');

app.use(bodyReq.urlencoded({ extended: false }));
app.use(morgan('dev'));

/*  Route   */
app.get('/', function (req, res) {
    res.render('index');
});
app.post('/messenger', function (req, res) {
    res.render('messenger', { nickname: req.body.nickname.trim() });
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

    // when someone send a image
    socket.on('new a image', function (data) {     
        var guess = data.base64.match(/^data:image\/(png|jpeg);base64,/)[1];
        var ext = "";
        switch (guess) {
            case "png":
                ext = ".png";
                break;
            case "jpeg":
                ext = ".jpg";
                break;
            default:
                ext = ".bin";
                break;
        }

        // Save image
        var savedFilename = "/upload/"+randomString(10)+ext;                
        fs.writeFile(__dirname + "/public" + savedFilename, getBase64Image(data.base64), 'base64', function (err) {
            if (err !== null)
                console.log(err);
            else {
                io.emit("receive a image", {
                    path: savedFilename,
                });

                // Save message
                msgs.push({
                    nickname: data.nickname,
                    data: savedFilename,
                    type: 'image'                    
                });
                console.log("Send photo success!");
            }                        
        });
    });

    socket.on('new active user', function (nickname) {
        users.push({
            nickname: nickname,
            socketId: socket.id
        });
        io.emit('new active user', nickname);
        console.log(users);
    });

    // when someone send a message
    socket.on('new message', function (msg) {
        socket.broadcast.emit('new message', msg);
        msgs.push(msg);
        console.log(msg);
    });

    // when someone's typing
    socket.on('typing', function (nickname) {
        socket.broadcast.emit('typing', nickname);
    });
    // when someone stop typing
    socket.on('stop typing', function (nickname) {
        socket.broadcast.emit('stop typing', nickname);
    });

    socket.on('disconnect', () => console.log('User disconnected'));
});

function randomString(length)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
 
    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
 
    return text;
}

function getBase64Image(imgData) {
    return imgData.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
}

http.listen(port, () => console.log("Server is running on port 3000"));

