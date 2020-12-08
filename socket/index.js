const Socket = require("socket.io");
const {USER_EVENT, LIST_ONLINE_USER_EVENT} = require("./eventConstant");

const cors = require('cors');
const http = require('http');
const tokenServices = require('../services/token-service');
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
  const {token} = auth;
  socket.user = tokenServices.verify(token).sub;
  next();
});


io.on('connection', (socket) => {

  if (socket.user) {
    users[socket.user._id] = socket.user;
    io.emit(USER_EVENT.ONLINE, {user: socket.user, id: socket.user.id});
  }

  socket.emit(LIST_ONLINE_USER_EVENT, users);
  socket.on('disconnect', () => {
      if (socket.user) {
        users[socket.user._id] = undefined;
        io.emit(USER_EVENT.OFFLINE, {user: socket.user, id: socket.user.id});
      }
    }
  );
});

