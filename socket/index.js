const Socket = require("socket.io");
const USER_EVENT = require("./eventConstant");

const cors = require('cors');
const http = require('http');
const io = new Socket.Server(3030, {
  cors: {
    origin: "*"
  }
});

const USER_STATUS_TOPIC = 'userStatus';


io.use((socket, next) => {
  next();
});

io.on('connection', (socket) => {

  io.emit(USER_EVENT.ONLINE, {user: socket.id, id: socket.id});
  socket.on('disconnect', () =>
    io.emit(USER_EVENT.OFFLINE, {user: socket.id, id: socket.id}));
});

