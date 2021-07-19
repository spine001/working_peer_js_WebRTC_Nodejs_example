// public/script.js
alert('Ready for a media call')
let Peer = window.Peer;
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

// Function to obtain stream and then await until after it is obtained to go into video chat call and answer code. Critical to start the event listener ahead of everything to ensure not to miss an incoming call.
peer.on("call", async (call) => {
    let stream = null;
    console.log('*** "call" event received, calling call.answer(strem)');
    // Obtain the stream object
    try {
        stream = await navigator.mediaDevices.getUserMedia(
            {
                audio: true,
                video: true,
            });
        // Set up event listener for a peer media call -- peer.call, returns a mediaConnection that I name call        
        // Answer the call by sending this clients video stream --myVideo-- to calling remote user
        call.answer(stream);
        // Create new DOM element to place the remote user video when it comes
        const video = document.createElement('video');
        // Set up event listener for a stream coming from the remote user in response to this client answering its call
        call.on("stream", (userVideoStream) => {
            console.log('***"stream" event received, calling addVideoStream(UserVideoStream)');
            // Add remote user video stream to this client's active videos in the DOM
            addVideoStream(video, userVideoStream);
        });
    } catch (err) {
        /* handle the error */
        console.log('*** ERROR returning the stream: ' + err);
    };
});

// Set up event listener for a new user connecting to the socket in the server, the server broadcasts a new user connection with its peer id
socket.on("user-connected", async (userId) => {
    // Invoke data connection initition to a new user upon being informed of its connection to the server by socket.io
    // Create a data link with new user
    connectDataToNewUser(userId);
    console.log('*** "user-connected" event received from userId: ' + userId);
    // Obtain myVideo stream again, must do it again, to make sure that it is available both when calling like here or when receiving a call, like on the peer.on('call'...)above. Doing it this way assures we get the event listener active before a call is made or received.
    try {
        stream = await navigator.mediaDevices.getUserMedia(
            {
                audio: true,
                video: true,
            })
    }
    catch (err) {
        /* handle the error */
        console.log('*** ERROR returning the stream: ' + err);
    };
    // Once the streat is obtained, proceed to connect remote user
    connectMediaToNewUser(userId, stream);
});

// Show myVideo on the client screen
(async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia(
            {
                audio: true,
                video: true,
            });
        if (stream != undefined) {
            addVideoStream(myVideo, stream);
        } else {
            console.log('You can only access your audio/video media streams over https');
            alert('Sorry retry using https, for security reasons Google Media blocks access to your video stream over unsecure http connections');
        }


    } catch (err) {
        /* handle the error */
        console.log('*** ERROR returning the stream: ' + err);
        alert('Sorry retry using https, for security reasons Google Media blocks access to your video stream over unsecure http connections');
    }
})();

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

// Set up event listener for user-disconnected event, returns userId
socket.on("user-disconnected", (userId) => {
    if (peers[userId]) { // if it exists close connection
        peers[userId].close();
        console.log('*** "user-disconnected" event received from userId: ' + userId);
    }
});

// Set up event listener for an "another user" data connection established event
peer.on("connection", (conn) => {
    console.log('*** Connection to remote userId: ' + peer.id + ' established');
    conn.on("data", (data) => {
        console.log('*** Received data ' + data + ' from originator userId: ' + conn.peer + ' as destination');
    });
    // Set up event listener for connection conn established event
    conn.on("open", () => {
        conn.send('Hello!');
        console.log('*** Received open, sending Hello to origin from destination userId: ' + conn.peer);
    });
});

const connectDataToNewUser = (userId) => {
    // ConnectDataToNewUser
    // Start data connection upon connect received from server socket by requesting data connection with remote user
    let conn = peer.connect(userId);
    // Set up event listener for data received from remote user
    conn.on("data", (data) => {
        console.log('*** Received data: ' + data + ', from remote userId: ' + userId + 'as originator, meaning I called and got a reply');
    });
    // Set up event listener for connection conn established event
    conn.on("open", () => {
        conn.send('hi!');
    });
};

const connectMediaToNewUser = (userId, stream) => {
    // ConnectMediaToNewUser
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