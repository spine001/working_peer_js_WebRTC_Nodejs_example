// public/script.js
alert('Ready for a media call')
let Peer = window.Peer;
let status = false; // for debug to delete later
const socket = io('/');

// obtain js representation of DOM element video-grid
const videoGrid = document.getElementById("video-grid");
// obtain js representation of DOM element video
const myVideo = document.createElement("video");
myVideo.muted = true; // Mute the client's owner own video channel
const peers = {}; // object to keep track of connected peers
// Create a new instance of the class Peer
const peer = new Peer({
    host: '/',
    path: '/myapp',
    debug: 2,
    port: 3001,
});
// Set up event listener for a peer server data connection established event
peer.on("open", (id) => {
    console.log('*** "open" event received from userId: ' + id + ', occurs when connection to peer server is established');
    socket.emit("join-room", ROOM_ID, id);
    console.log('*** "join-room" emit for ROOM_ID: ' + ROOM_ID + ', and userId: ' + id);
});
// Handle a peer connection error
peer.on("error", (err) => {
    console.log('error: ' + err + ' when setting the event handler "call"');
})
// Set up event listener for an "another user" data connection established event
peer.on("connection", (conn) => {
    console.log('***incoming peer connection');
    // Set up event listener for connection conn data received event from user conn id
    conn.on("data", (data) => {
        console.log('***received data ' + data);
    });
    // Set up event listener for connection conn established event
    conn.on("open", () => {
        conn.send('Hello!');
    });
});

// Set up event listener for user-disconnected event, returns userId
socket.on("user-disconnected", (userId) => {
    if (peers[userId]) { // if it exists close connection
        peers[userId].close();
        console.log('*** "user-disconnected" event received from userId: ' + userId);
    }
});

// Function to obtain stream and then await until after it is obtained to go into video chat call and answer code
async function getMedia(constraints) {
    let stream = null;
    let counter = 0;// for debug to delete later
    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        /* use the stream */
        // add my this client's stream to it's myVideo element
        addVideoStream(myVideo, stream);
        status = true; // for debug to delete later
        // Set up event listener for a peer media call -- peer.call, returns a mediaConnection that I name call
        peer.on("call", (call) => {
            counter++;// for debug to delete later
            console.log('*** "call" event received, calling call.answer(strem) counter= ' + counter);
            // Answer the call by sending this clients video stream --myVideo-- to calling remote user
            call.answer(stream);
            // Create new DOM element to place the remote user video when it comes
            const video = document.createElement('video');
            // Set up event listener for a stream coming from the remote user in response to this client answering its call
            call.on("stream", (userVideoStream) => {
                counter++;// for debug to delete later
                console.log('***"stream" event received, calling addVideoStream(UserVideoStream), counter= ' + counter);
                // Add remote user video stream to this client's active videos in the DOM
                addVideoStream(video, userVideoStream);
            });
        });

        // Set up event listener for a new user connecting to the socket in the server, the server broadcasts a new user connection with its peer id
        socket.on("user-connected", (userId) => {
            // Invoke data and media connection initition to a new user upon being informed of its connection to the server by socket.io
            connectToNewUser(userId, stream)
            console.log('*** "user-connected" event received from userId: ' + userId);
        });
        if(status) console.log('*** Media stream obtained, await function finished');// for debug to delete later
    } catch (err) {
        /* handle the error */
        console.log('*** ERROR returning the stream: ' + err);
    }
}
getMedia({
    audio: true,
    video: true,
})

const connectToNewUser = (userId, stream) => {
    // ConnectToNewUser

    // Start data connection upon connect received from server socket by requesting data connection with remote user
    let conn = peer.connect(userId);
    // Set up event listener for data received from remote user
    conn.on("data", (data) => {
        console.log('received: ' + data);
    });
    // Set up event listener for connection conn established event
    conn.on("open", () => {
        conn.send('hi!');
    });

    // Start media call upon connect by calling peer.call remote user, returns mediaConnection object named call here
    const call = peer.call(userId, stream);
    console.log('*** peer.call calling userId: ' + userId);
    // Create video element to place video
    const video = document.createElement('video');
    // Set up event listener for media stream being sent to this client by remote client in response to media call with call.answer(stream)
    call.on("stream", (userVideoStream) => {
        console.log('*** "stream" event received from userId: ' + userId + ', in response to my call, calling addVideoStream(UserVideoStream)');
        addVideoStream(video, userVideoStream);
    });
    // Set up event listener for handling a close event by removing the video closed
    call.on("close", () => {
        console.log('*** "close" event received on call.on, removing video');
        video.remove();
    });
    // Set up event listener for handling an error event ona mediaConnection object call
    call.on("error", (error) => {
        console.log('*** ERROR in call.on inside connectToNewUser');
    });
    // Maintain list of peers connected
    peers[userId] = call;
};

const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
        videoGrid.append(video);
    });
};