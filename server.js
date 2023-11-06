'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const { createServer } = require("http");
const { Server } = require("socket.io");

const PORT = 8080;

const app = express();
app.use(bodyParser.json());
const httpServer = createServer(app);
const io = new Server(httpServer);

const users = new Map() // key-value in-memory store

//--------------- Socket Start ---------------//

io.on("connection", (socket) => {
  console.log(`user ${socket.id} is connected`);

  socket.on("disconnect", () => {
    console.log(`user ${socket.id} is disconnected`);
  });

  // we use this channel to exchange secret key and iv
  socket.on("key-exchange", (data) => {
    if (!users.has(data.to)) return;
    const user = users.get(data.to);
    io.to(user.socketID).emit("key-exchange", data);
  });

  // we use this channel to send encrypted chat message
  socket.on("chat", (data) => {
    socket.broadcast.emit("chat", data);
  });
});

//--------------- Socket End ---------------//
//--------------- REST API Start ---------------//

app.get("/download/:username", (req, res) => {
  const data = {
    username: req.params.username,
    publicKey: "username-public-key",
    signatureAlgorithm: "rsa", // signature algorithm to use
    encryptionAlgorithm: "rsa", // asymmetric encryption algorithm to use 
    symmetricAlgorithm: "aes-256-cbc", // symmetrc encryption algorithm to use
    hash: "sha256" // hash algorithm to use
  };

  res.send(JSON.stringify(data));
});

app.post("/register", function (req, res) {
  console.log(`received user registration from (${req.body.username}, ${req.body.publicKey}, ${req.body.socketID})`);

  const data = {
    socketID: req.body.socketID,
    publicKey: req.body.publicKey
  }
  users.set(req.body.username, data);

  res.send("successfully registered");
});

//--------------- REST API End ---------------//

httpServer.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
