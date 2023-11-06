const rl = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout
});
const { getSocket, downloadPublicKey, registerUser } = require("./client-util");
const socket = getSocket();

let username, privateKey, publicKey;

//--------------- Socket Event Start ---------------//

socket.on("connect", () => {
  console.log("Connected with id:", socket.id);
});
socket.on("disconnect", () => {
  console.log("Disconnected!");
});
socket.on("broadcast", (data) => {
  console.log(`${data.sender}: ${data.msg}`);
});

//--------------- Socket Event End ---------------//

async function main() {
  username = "trudy";
  publicKey = "trudy-public-key";

  console.log("Hello", username);

  // Trudy does not need to register
  // Trudy just want to mess around

  const aliceData = await downloadPublicKey("alice");
  const bobData = await downloadPublicKey("bob");

  // triggered on end-of-line input (\n, \r, or \r\n)
  rl.on("line", (input) => {
    // We assume that Trudy wants to imitate Alice
    const data = {
      "sender": aliceData.username,
      "msg": input
    };

    // We assume that Trudy wants to imitate Bob
    // const data = {
    //   "sender": bobData.username,
    //   "msg": input
    // };

    socket.emit("broadcast", data);
  });

  // triggered on CTRL+C like command
  rl.on('SIGINT', () => {
    process.exit(0);
  });
}

main();