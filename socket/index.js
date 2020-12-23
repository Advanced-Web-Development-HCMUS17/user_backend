const { Lobby, PLAYER_1 } = require('../entity/Lobby');

const { USER_EVENT, LIST_ONLINE_USER_EVENT, LOBBY_EVENT, CHAT_EVENT } = require("./eventConstant");
const tokenServices = require('../services/token-service');

const { v4: uuidV4 } = require('uuid');

module.exports = (app) => {

  let users = {};
  let lobbies = {};
  let chats = {};
  const io = app.get('io');

  io.use((socket, next) => {
    console.log(socket.handshake.auth);
    const auth = socket.handshake.auth;
    const { token } = auth;
    socket.user = tokenServices.verify(token).sub;
    next();
  });

  io.on('connection', (socket) => {

    if (socket.user) {
      users[socket.user._id] = socket.user;
      io.emit(USER_EVENT.ONLINE, { user: socket.user, id: socket.user.id });
    }
    io.to(socket.id).emit(LIST_ONLINE_USER_EVENT, users);
    socket.on('disconnect', () => {
      if (socket.user) {
        users[socket.user._id] = undefined;
        io.emit(USER_EVENT.OFFLINE, { user: socket.user, id: socket.user.id });
      }
      if (socket.gameRoom) {
        const { lobbyId, player } = socket.gameRoom;
        const lobby = lobbies[lobbyId];
        const leftPlayer = lobby.leave(player);
        io.to(lobbyId).emit(LOBBY_EVENT.LEAVE_LOBBY, { leftPlayer: leftPlayer });
      }
    }
    );

    socket.on(LOBBY_EVENT.LEAVE_LOBBY, () => {
      if (socket.gameRoom) {
        const { lobbyId, player } = socket.gameRoom;
        const lobby = lobbies[lobbyId];
        const leftPlayer = lobby.leave(player);
        socket.leave(lobbyId);
        io.to(lobbyId).emit(LOBBY_EVENT.LEAVE_LOBBY, { leftPlayer: leftPlayer });
      }
    });

    socket.on(LOBBY_EVENT.CREATE_LOBBY, () => {
      const lobbyId = uuidV4();
      const newLobby = new Lobby(lobbyId, this.user);
      const roomId = newLobby.getRoomName();
      lobbies[roomId] = newLobby;
      chats[roomId] = [];
      socket.join(roomId);
      socket.gameRoom = { lobbyId: lobbyId, player: PLAYER_1 };
      socket.emit(LOBBY_EVENT.CREATE_LOBBY, { roomId: roomId, player: PLAYER_1 });
    });

    socket.on(LOBBY_EVENT.JOIN_LOBBY, ({ roomId }) => {
      const lobby = lobbies[roomId];
      socket.emit(LOBBY_EVENT.LOBBY_INFO, lobby);
      if (!socket.user) return;
      if (!lobby) return;
      const join = lobby.join(socket.user);
      if (!join) {
        socket.emit(LOBBY_EVENT.LOBBY_INFO, lobby);
      } else {
        socket.join(lobby.getRoomName());
        socket.gameRoom = { lobbyId: lobby.getRoomName(), player: PLAYER_1 };
        io.to(lobby.getRoomName()).emit(LOBBY_EVENT.JOIN_LOBBY, { user: socket.user, player: join });
        socket.emit(LOBBY_EVENT.LOBBY_INFO, lobby);
      }
    });

    /*
    CHAT SOCKET
     */
    socket.on(CHAT_EVENT.RECEIVE_MESSAGE, ({message, time}) => {
      if (socket.user && socket.gameRoom) {
        const {lobbyId} = socket.gameRoom;
        const chat_message = {user: socket.user, message: message, time: time};
        chats[lobbyId] = [...chats[lobbyId], chat_message];
        io.to(lobbyId).emit(CHAT_EVENT.SEND_MESSAGE, {messageList: chats[lobbyId]});
      }
    });

    /*
    GAME SOCKET
     */
    socket.on(LOBBY_EVENT.RECEIVE_MOVE,(move) => {
        socket.emit(LOBBY_EVENT.SEND_MOVE,{move});
    });
  });
}
