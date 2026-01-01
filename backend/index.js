const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Backend Ayakta!"));

io.on("connection", (socket) => {
  console.log("Bir cihaz bağlandı:", socket.id);
});

server.listen(5000, () => console.log("Sunucu port 5000 üzerinde çalışıyor."));
