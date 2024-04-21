# working_peer_js_WebRTC_Nodejs_example

Wow, the stuff in my first readme.md looks so pompous! Sorry didn't mean it that way, the funnies part, is that eventhogh, I was close to correct, I was still wrong.

The issue is a timing issue, the problem is that many if not all tutorials of peerjs out
there are calling the navigator.mediaDevices.getUserMedia function to get the local stream and then after that function returns, either because the call it synchronously or asynchronously with a .then or an async await style, the timing problem is still there. So what is this timing problem? The problem is that the origin peer, upon receipt of the signal from the signaling server, that a destination server has entered the call, can originate a call to the destination server faster than the destination server can obtain its own stream information, therefore, those examples fail to call the peer.on('call',   ....{

})

event handler for the event 'call' before the origin client has already sent it by invoking the peer.call(userId) method, thus the call fails since the event arrives at
the destination client before it has had time to set up the 'call' event handler.
navigator.mediaDevices.getUserMedia
This can be easily remedied by first creating the 'call' event handler and then and only then invoking the navigator.mediaDevices.getUserMedia function asynchronously preferrably and in my case by using the asyn await syntax.

So here you have a bare bones incomplete example that will work between the tabs of localhost in your local machine for n video conference call participants. I will deploy this to my own server and if I make the time from my partner's lists of home tasks, I will post how to here. Wish me a simple deployment.

By the way, I am using an ubuntu 20.04 desktop with Apache as a server reverse proxying to nodejs.

The example doesn't incorporate a STUN/TURN server. Haven't gotten there to play with them and peerjs.

I haven't yet managed to attach successfully the peerjs server to the nodejs server so you will need to install
peerjs with npm install -g peerjs open a new terminal and run it with:
 peerjs --port 3001 --key peerjs --path /myapp

 Then just open localhost:3030 on one of your tabs in Chrome (last version as of 7-18-2021), after the screen
 receives an alert, click on OK and then copy the url to another tab, cut an past the url in the second tab, 
 and now you should have 2 videos on each tab. Its working! Adjust to your situation.

I started from this tutorial, but nothing worked as it should, at the beginning I included corrections as comments, but then it got to be way too much.

Video chat app tutorial from
https://prog.world/creating-a-video-chat-with-node-js-socket-io-webrtc/

After wasting an inordinate number of hours reading everything on the internet and having nothing work for me
with the 3.1 release of the freejs package for a simple example with two tabs of the same browser talking
with each other I ended up figuring out what the problem was but doing the uexpected. I decided to make the calls
outside of the .then promise handling function and all the sudden the peer.on ('call'.....) handler started working
as it was supposed to. From there I changed my code to include an async function that uses the try/catch approch
including await to wait for the stream:

async function getMedia(constraints) {
  let stream = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    /* use the stream */
  } catch(err) {
    /* handle the error */
  }
}

as depicted in the man pages https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia

