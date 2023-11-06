const axios = require('axios').default;
const { io } = require("socket.io-client");

const domain = "localhost";
const port = 8080;

const url = "http://" + domain + ":" + port.toString();
const downloadUrl = url + "/download";
const registerUrl = url + "/register";

function getSocket() {
  return io(url);
}

async function downloadPublicKey(username) {
  try {
    const url = downloadUrl + "/" + username;
    const response = await axios.get(url);
    return response.data;
  } catch (err) {
    console.error(err);
  }
}

async function registerUser(username, publicKey, socketID) {
  const postData = {
    username: username,
    publicKey: publicKey,
    socketID: socketID
  };
  try {
    await axios.post(registerUrl, postData);
  } catch (err) {
    console.error(err);
  }
}

function mergeBytes(firstByte, secondByte) {
  const totalBytes = firstByte.length + secondByte.length;
  return Buffer.concat([firstByte, secondByte], totalBytes);
}

function mergeKeyAndIV(key, iv) {
  const mergedBuff = mergeBytes(key, iv);
  return "0x" + mergedBuff.toString("hex");
}

function splitKeyAndIV(combined) {
  const parts = combined.split("0x");
  const mergedBuff = Buffer.from(parts[1], "hex");
  const splitKey = mergedBuff.subarray(0, 16);
  const splitIV = mergedBuff.subarray(-8);
  return { splitKey, splitIV };
}

module.exports = {
  getSocket,
  downloadPublicKey,
  registerUser,
  mergeBytes,
  mergeKeyAndIV,
  splitKeyAndIV
}