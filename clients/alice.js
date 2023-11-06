const readlinePromises = require('node:readline/promises');
const rl = readlinePromises.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const { getSocket, downloadPublicKey, registerUser, mergeBytes, mergeKeyAndIV, splitKeyAndIV } = require("./client-util");
const socket = getSocket();

let username, socketID;
let privateKey, publicKey;
let bobPublicKey;
let firstHalfKey, firstHalfIV;
let secondHalfKey, secondHalfIV;
let sessionKey, sessionIV;

//--------------- Socket Event Start ---------------//

socket.on("connect", async () => {
  socketID = socket.id;
  username = "alice";
  publicKey = "alice-public-key";

  console.log("Hello", username);
  console.log("Connected with id:", socketID);

  await registerUser(username, publicKey, socketID);

  // we assume that Alice want to communicate with Bob
  const bobData = await downloadPublicKey("bob");
  console.log(bobData);

  const answer = await rl.question("Is Bob ready to do key exchange? (yes, y or no, n)");
  if (answer == "no" || answer == "n") {
    console.log("Please try again later");
    process.exit(0);
  }

  // you should make first half key and iv here
  // then you encrypt and sign the first half payload

  const data = {
    "from": username,
    "to": "bob",
    "signature": "resulted-signature",
    "payload": "encrypted-secret-key-and-iv"
  };
  socket.emit("key-exchange", data);
});

socket.on("disconnect", () => {
  console.log("Disconnected!");
  process.exit(0);
});

socket.on("key-exchange", (data) => {
  console.log(`Receive second half key from: ${data.from}, to: ${data.to}, signature: ${data.signature}, payload: ${data.payload}`);

  if (data.to != username) return;

  // you should decrypt payload from bob here
  // you should verify the signature from bob here

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