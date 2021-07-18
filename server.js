// server.js
const express = require('express');
//const { ExpressPeerServer } = require('peer')

// const server = require('http').Server(app);
const { v4: uuidv4 } = require('uuid');

const app = express();
const path = require('path');

app.set('view engine', 'ejs')

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.redirect(`${uuidv4()}`);
});

app.get('/:room', (req, res) => {
    console.log('roomId: ' + req.params.room);
    res.render('room', { roomId: req.params.room });
}); // Between brakets passes the variable roomId to room.ejs

const server = app.listen(3030, () => {
    console.log('node server listening on port: '+server.address().port);
});

// const peerServer = ExpressPeerServer(server, {debug: true, path: '/myapp'})
// const peerServer = ExpressPeerServer(server, {port:3030, path: '/myapp', debug: true });

// app.use('/peerjs', peerServer);

const io = require('socket.io')(server, {
    cors: {
        origin: "*",
    },
});

io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId) => {
        console.log('*** "join-room" event received from client: '+userId+' in roomId: '+roomId);
        socket.join(roomId);
        socket.broadcast.to(roomId).emit('user-connected', userId);
        console.log('*** "user-connected" event broadcasted to roomId: '+roomId+' for userId: '+userId+' from server');
        socket.on("disconnect", () => {
            socket.broadcast.to(roomId).emit('user-disconnected', userId);
            console.log('*** "disconnect" event broadcasted to roomId: '+roomId+' for userId: '+userId+' from server');
        });
    });
});
