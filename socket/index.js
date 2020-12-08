const Socket = require("socket.io");
const {USER_EVENT, LIST_ONLINE_USER_EVENT} = require("./eventConstant");

const cors = require('cors');
const http = require('http');
const io = new Socket.Server(3030, {
  cors: {
    origin: "*"
  }
});

const USER_STATUS_TOPIC = 'userStatus';

let users = {};

io.use((socket, next) => {
  console.log(socket.handshake.auth);
  const auth = socket.handshake.auth;
  next();
});


io.on('connection', (socket) => {

  users[socket.id] = socket.id;
  io.emit(USER_EVENT.ONLINE, {user: socket.id, id: socket.id});

  socket.emit(LIST_ONLINE_USER_EVENT, users);
  socket.on('disconnect', () => {
      users[socket.id] = undefined;
      io.emit(USER_EVENT.OFFLINE, {user: socket.id, id: socket.id});
    }
  );
});

