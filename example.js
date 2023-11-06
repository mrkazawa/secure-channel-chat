const crypto = require('crypto');

let payload, data, signature, ciphertext, recoveredPlaintext, isVerified;

// both party agree on security parameters
const algorithm = "aes-256-cbc"; // symmetric key algorithm to use
const options = {
  modulusLength: 2048, // default is 2048 bits
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  }
};

// recipient create private and public key
const { privateKey: recipientPrivateKey, publicKey: recipientPublicKey } = crypto.generateKeyPairSync("rsa", options);
console.log("> Recipient sends PUBLIC KEY sender");
// sender generates private and public key
const { privateKey: senderPrivateKey, publicKey: senderPublicKey } = crypto.generateKeyPairSync("rsa", options);

//------------------- First Half (Start) -------------------//

// sender generates first half of secret key and iv
// note that, normally they are 32 and 16 bytes
const senderSecretKey = crypto.randomBytes(16);
const senderIV = crypto.randomBytes(8);

// sender prepares payload to be signed and encrypted
payload = mergeKeyAndIV(senderSecretKey, senderIV);
data = Buffer.from(payload);

// sender signs and encrypts the payload
signature = crypto.sign("sha256", data, senderPrivateKey);
ciphertext = crypto.publicEncrypt(recipientPublicKey, data);

console.log("> Sender sends SIGNATURE and CIPHERTEXT to recipient");

// recipient decrypts amd verifies the payload
recoveredPlaintext = crypto.privateDecrypt(recipientPrivateKey, ciphertext).toString("utf8");
isVerified = crypto.verify("sha256", data, senderPublicKey, signature);
if (!isVerified) throw new Error("invalid signature");
const { splitKey: secretKeyFromSender, splitIV: ivFromSender } = splitKeyAndIV(recoveredPlaintext);

//------------------- First Half (End) -------------------//
//----------------- Second Half (Start) ------------------//

// recipient generates second half of secret key and iv
// note that, normally they are 32 and 16 bytes
const recipientSecretKey = crypto.randomBytes(16);
const recipientIV = crypto.randomBytes(8);

// recipient prepares payload to be signed and encrypted
payload = mergeKeyAndIV(recipientSecretKey, recipientIV);
data = Buffer.from(payload);

// recipient signs and encrypt the payload
signature = crypto.sign("sha256", data, recipientPrivateKey);
ciphertext = crypto.publicEncrypt(senderPublicKey, data);

console.log("> Recipient sends SIGNATURE and CIPHERTEXT to sender");

// sender decrypts the payload and verify the payload
recoveredPlaintext = crypto.privateDecrypt(senderPrivateKey, ciphertext).toString("utf8");
isVerified = crypto.verify("sha256", data, recipientPublicKey, signature);
if (!isVerified) throw new Error("invalid signature");
const { splitKey: secretKeyFromRecipient, splitIV: ivFromRecipient } = splitKeyAndIV(recoveredPlaintext);

console.log("> All parts (first and second half) of SECRET KEY and IV");
console.log("  have been obtained by both sender and recipient");

//------------------- Second Half (End) -------------------//
//---------------- Secure Channel (Start) -----------------//

// sender builds the session key and iv
const senderSessionKey = mergeBytes(senderSecretKey, secretKeyFromRecipient);
const senderSessionIV = mergeBytes(senderIV, ivFromRecipient);

// sender encrypts the message
const message = "this is a secret message";
const cipher = crypto.createCipheriv(algorithm, senderSessionKey, senderSessionIV);
let c = cipher.update(message, "utf8", "hex");
c += cipher.final("hex");

console.log("> Sender sends CIPHERTEXT to recipient");

// recipient builds the session key and iv
const recipientSessionKey = mergeBytes(secretKeyFromSender, recipientSecretKey);
const recipientSessionIV = mergeBytes(ivFromSender, recipientIV);

// recipient decrypts the received message
const decipher = crypto.createDecipheriv(algorithm, recipientSessionKey, recipientSessionIV);
let d = decipher.update(c, "hex", "utf8");
d += decipher.final("utf8");

if (Buffer.compare(senderSessionKey, recipientSessionKey)) throw new Error("invalid session key");
if (Buffer.compare(senderSessionIV, recipientSessionIV)) throw new Error("invalid session IV");
if (d != message) throw new Error("invalid decryption");

//------------------ Secure Channel (End) ------------------//

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
