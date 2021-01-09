const { Lobby, PLAYER_1 } = require('../entity/Lobby');

const { USER_EVENT, LIST_ONLINE_USER_EVENT, LOBBY_EVENT, CHAT_EVENT, GAME_EVENT } = require("./eventConstant");
const tokenServices = require('../services/token-service');

const {v4: uuidV4} = require('uuid');
const gameServices = require('../services/game-service');
const {checkHistory} = require('../services/game-service');
const {row} = require('../constants/constants.js');

const User = require('../models/userModel');

const USER_ROOM_PREFIX = 'user';

module.exports = (app) => {

  let users = {};
  let lobbies = {};
  let ready = new Map();
  let userTurn = new Map();
  let histories = new Map();
  let chats = {};
  const io = app.get('io');

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
      socket.join(USER_ROOM_PREFIX + socket.user._id);
      io.emit(USER_EVENT.ONLINE, {user: socket.user, id: socket.user.id});

    }
    io.to(socket.id).emit(LIST_ONLINE_USER_EVENT, users);

    socket.on(LOBBY_EVENT.INVITE, async ({email}) => {
      const user = await User.findOne({email: email}).lean();
      console.log(LOBBY_EVENT.INVITE, socket.user, "TO", user);
      if (user) {
        const userId = user._id;
        if (socket.user && socket.gameRoom) {
          socket.to(USER_ROOM_PREFIX + userId).emit(LOBBY_EVENT.INVITE, ({
            inviteUser: socket.user,
            lobbyId: socket.gameRoom.lobbyId
          }));
        }
      }
    })

    socket.on('disconnect', () => {
        if (socket.user) {
          users[socket.user._id] = undefined;
          io.emit(USER_EVENT.OFFLINE, {user: socket.user, id: socket.user.id});
        }
        if (socket.gameRoom) {
          const {lobbyId, player} = socket.gameRoom;
          const lobby = lobbies[lobbyId];
          const leftPlayer = lobby.leave(player);
          io.to(lobbyId).emit(LOBBY_EVENT.LEAVE_LOBBY, {leftPlayer: leftPlayer});
        }
      }
    );

    socket.on(LOBBY_EVENT.LEAVE_LOBBY, () => {
      if (socket.gameRoom) {
        const {lobbyId, player} = socket.gameRoom;
        const lobby = lobbies[lobbyId];
        const leftPlayer = lobby.leave(player);
        socket.leave(lobbyId);
        io.to(lobbyId).emit(LOBBY_EVENT.LEAVE_LOBBY, {leftPlayer: leftPlayer});
      }
    });

    socket.on(LOBBY_EVENT.CREATE_LOBBY, () => {
      const lobbyId = uuidV4();
      const newLobby = new Lobby(lobbyId, this.user);
      const roomId = newLobby.getRoomName();
      lobbies[roomId] = newLobby;
      chats[roomId] = [];
      socket.join(roomId);
      socket.gameRoom = {lobbyId: lobbyId, player: PLAYER_1};
      socket.emit(LOBBY_EVENT.CREATE_LOBBY, {roomId: roomId, player: PLAYER_1});
    });

    socket.on(LOBBY_EVENT.JOIN_LOBBY, ({roomId}) => {
      const lobby = lobbies[roomId];
      socket.emit(LOBBY_EVENT.LOBBY_INFO, lobby);
      if (!socket.user) return;
      if (!lobby) return;
      const join = lobby.join(socket.user);
      if (!join) {
        socket.emit(LOBBY_EVENT.LOBBY_INFO, lobby);
      } else {
        socket.join(lobby.getRoomName());
        socket.gameRoom = {lobbyId: lobby.getRoomName(), player: PLAYER_1};
        io.to(lobby.getRoomName()).emit(LOBBY_EVENT.JOIN_LOBBY, {user: socket.user, player: join});
        io.to(lobby.getRoomName()).emit(LOBBY_EVENT.LOBBY_INFO, lobby);
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

    socket.on(GAME_EVENT.GAME_READY, () => {

      if (socket.gameRoom && socket.user) {
        console.log("Yes");
        const lobbyId = socket.gameRoom.lobbyId;
        const thisUser = socket.user.username;
        console.log(lobbyId, thisUser);
        let thisLobby = lobbies[lobbyId];
        const {player1, player2} = thisLobby.getPlayers();
        if (player1 && player2) {
          if (player1.username === thisUser || player2.username === thisUser) {

            let readyList = ready.get(lobbyId);
            if (!readyList) {
              readyList = [];
              readyList.push(thisUser);
              ready.set(lobbyId, readyList);
            } else if (readyList.length === 1 && !find(readyList, thisUser)) {
              readyList.push(thisUser);
              ready.set(lobbyId, readyList);
              const randNum = gameServices.getRandom(1, 2);

              histories.set(lobbyId, []);


              let userFirst, userSecond;
              if (randNum === 1) {
                userFirst = readyList[0];
                userSecond = readyList[1];
              } else {
                userFirst = readyList[1];
                userSecond = readyList[0];
              }
              userTurn.set(lobbyId, userFirst);

              gameServices.createGame(lobbyId, userFirst, userSecond);

              io.to(lobbyId).emit(GAME_EVENT.GAME_START, {
                userFirst: userFirst,
                userSecond: userSecond,
                boardSize: row
              });
              console.log("Worked");
            }
          }
        }
      }
    });


    socket.on(GAME_EVENT.SEND_MOVE, ({move}) => {
      const lobbyId = socket.gameRoom.lobbyId;
      const thisUser = socket.user.username;
      let thisTurn = userTurn.get(lobbyId);
      let history = histories.get(lobbyId);
      if (checkHistory(history, move) && thisTurn === thisUser) {
        // set userTurn

        const {player1, player2} = lobbies[lobbyId].getPlayers();
        thisTurn = (player1.username === thisTurn) ? player2.username : player1.username;
        userTurn.set(lobbyId, thisTurn);

        history.push(move);
        histories.set(lobbyId, history);

        const winSquares = gameServices.calculateWinner(history, move, row);
        if (winSquares) {
          console.log("Game end!");
          gameServices.saveGame(lobbyId, history, thisUser, chats[lobbyId]);
          userTurn.set(lobbyId, undefined);
          io.to(lobbyId).emit(GAME_EVENT.GAME_END, {
            newHistory: history,
            userWin: thisUser,
            winChain: winSquares,
            boardSize: row
          });
        } else {
          console.log("Send move to client!");
          io.to(lobbyId).emit(GAME_EVENT.SEND_MOVE, {newHistory: history, userTurn: thisTurn, boardSize: row});
        }
      }
    })
  });
}

const find = (array, value) => {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === value) {
      return true;
    }
  }
  return false;
}
