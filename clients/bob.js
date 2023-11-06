const readlinePromises = require('node:readline/promises');
const rl = readlinePromises.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const { getSocket, downloadPublicKey, registerUser, mergeBytes, mergeKeyAndIV, splitKeyAndIV } = require("./client-util");
const socket = getSocket();

let username, socketID;
let privateKey, publicKey;
let alicePublicKey;
let firstHalfKey, firstHalfIV;
let secondHalfKey, secondHalfIV;
let sessionKey, sessionIV;

//--------------- Socket Event Start ---------------//

socket.on("connect", async () => {
  socketID = socket.id;
  username = "bob";
  publicKey = "bob-public-key";

  console.log("Hello", username);
  console.log("Connected with id:", socketID);

  await registerUser(username, publicKey, socketID);

  // we assume that Bob want to communicate with Alice
  const aliceData = await downloadPublicKey("alice");
  console.log(aliceData);

  console.log("Bob is ready to receive key-exchange!");
});

socket.on("disconnect", () => {
  console.log("Disconnected!");
  process.exit(0);
});

socket.on("key-exchange", (data) => {
  console.log(`Receive furst half key from: ${data.from}, to: ${data.to}, signature: ${data.signature}, payload: ${data.payload}`);

  if (data.to != username) return;

  // you should decrypt payload from alice here
  // you should verify the signature from alice here
  // if valid, you should make second half key and iv
  // then you encrypt and sign the second half payload

  const response = {
    "from": username,
    "to": "alice",
    "signature": "resulted-signature",
    "payload": "encrypted-secret-key-and-iv"
  };
  socket.emit("key-exchange", response);

  // you can now create the session key and iv
});

socket.on("chat", (data) => {
  // you should decrypt the message using aes here
  // with the session key and iv
  console.log(`${data.sender}: ${data.msg}`);
});

//--------------- Socket Event End ---------------//

// triggered on end-of-line input (\n, \r, or \r\n)
rl.on("line", (input) => {
  // you should encrypt the message using aes here
  const data = {
    "sender": username,
    "msg": input
  };
  socket.emit("chat", data);
});

// triggered on CTRL+C like command
rl.on('SIGINT', () => {
  process.exit(0);
});