const {Lobby, PLAYER_1} = require('../entity/Lobby');

const {USER_EVENT, LIST_ONLINE_USER_EVENT, LOBBY_EVENT, CHAT_EVENT, GAME_EVENT, HOME_EVENT, REPLAY_EVENT} = require("./eventConstant");
const tokenServices = require('../services/token-service');

const {v4: uuidV4} = require('uuid');
const gameServices = require('../services/game-service');
const {checkHistory} = require('../services/game-service');
const {row} = require('../constants/constants.js');

const {User} = require('../models/userModel');

const USER_ROOM_PREFIX = 'user';
const RATING_OFFSET = 500;

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
      io.emit(LIST_ONLINE_USER_EVENT, users);
    }
    socket.emit(LIST_ONLINE_USER_EVENT, users);
    socket.emit(LOBBY_EVENT.LIST_LOBBY, lobbies);

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
          io.emit(LIST_ONLINE_USER_EVENT, users);
        }
        if (socket.gameRoom) {
          const {lobbyId, player} = socket.gameRoom;
          const lobby = lobbies[lobbyId];
          if (lobby) {
            const leftPlayer = lobby.leave(player);
            if (lobby.player1 == null && lobby.player2 == null) {
              lobbies[lobbyId] = undefined;
            }
            io.to(lobbyId).emit(LOBBY_EVENT.LEAVE_LOBBY, {leftPlayer: leftPlayer});
            io.emit(LOBBY_EVENT.LIST_LOBBY, lobbies);
          }

        }
      }
    );

    socket.on(LOBBY_EVENT.LEAVE_LOBBY, async () => {
      if (socket.gameRoom) {
        const {lobbyId, player} = socket.gameRoom;
        const lobby = lobbies[lobbyId];
        if (!lobby) return;
        const leftPlayer = lobby.leave(player);
        if (lobby.isEnded() === true) {
          // If the game is being played
          if (userTurn.get(lobbyId)) {
            await gameServices.saveGame(lobbyId, histories.get[lobbyId], 'Draw', chats[lobbyId]);

          }
          delete lobbies[lobbyId];
          const keys = Object.keys(lobbies);
          const values = Object.values(lobbies);
          socket.emit(HOME_EVENT.GET_LOBBIES, {lobbiesID: keys, lobbies: values});
        }
        socket.leave(lobbyId);
        io.to(lobbyId).emit(LOBBY_EVENT.LEAVE_LOBBY, {leftPlayer: leftPlayer});

        if (lobby.player1 == null && lobby.player2 == null) {
          lobbies[lobbyId] = undefined;
        }
        io.to(lobby.getRoomName()).emit(LOBBY_EVENT.LOBBY_INFO, lobby);
        io.emit(LOBBY_EVENT.LIST_LOBBY, lobbies);
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

      io.emit(LOBBY_EVENT.LIST_LOBBY, lobbies);
    });

    socket.on(LOBBY_EVENT.JOIN_LOBBY, ({roomId}) => {
      const lobby = lobbies[roomId];
      console.log('User join: ', socket.user.username);
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
        socket.emit(LOBBY_EVENT.LOBBY_INFO, lobby);
        if (ready.get(lobby.getRoomName()) && ready.get(lobby.getRoomName()).length === 2) {
          io.to(lobby.getRoomName()).emit(GAME_EVENT.SEND_MOVE, {
            newHistory: histories.get(lobby.getRoomName()),
            userTurn: userTurn.get(lobby.getRoomName()), boardSize: row
          });
        }
        socket.gameRoom = {lobbyId: lobby.getRoomName(), player: PLAYER_1};
        io.to(lobby.getRoomName()).emit(LOBBY_EVENT.JOIN_LOBBY, {user: socket.user, player: join});
        io.to(lobby.getRoomName()).emit(LOBBY_EVENT.LOBBY_INFO, lobby);
        io.emit(LOBBY_EVENT.LIST_LOBBY, lobbies);
      }
    });

    socket.on(LOBBY_EVENT.FIND_LOBBY, () => {
      const user1 = socket.user;
      const result = findCompetitor(lobbies, user1);
      if (!result) {
        const lobbyId = uuidV4();
        const newLobby = new Lobby(lobbyId, user1);
        const roomId = newLobby.getRoomName();
        lobbies[roomId] = newLobby;
        chats[roomId] = [];
        socket.join(roomId);
        socket.gameRoom = {lobbyId: lobbyId, player: PLAYER_1};
        socket.emit(LOBBY_EVENT.CREATE_LOBBY, {roomId: roomId, player: PLAYER_1});
        io.emit(LOBBY_EVENT.LIST_LOBBY, lobbies);
      } else {
        const roomID = result.lobby.getRoomName();
        const competitor = result.competitor;
        socket.emit(LOBBY_EVENT.LOBBY_FOUND, {competitor: competitor, roomId: roomID});
      }
    })

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

    socket.on(GAME_EVENT.GAME_READY, async () => {

      if (socket.gameRoom && socket.user) {
        console.log("Yes");
        const lobbyId = socket.gameRoom.lobbyId;
        const thisUser = socket.user;
        console.log(lobbyId, thisUser);
        let thisLobby = lobbies[lobbyId];
        const {player1, player2} = thisLobby;
        if ((player1 && player1.username === thisUser.username) || (player2 && player2.username === thisUser.username)) {

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
            userTurn.set(lobbyId, userFirst.username);

            await gameServices.createGame(lobbyId, userFirst, userSecond);

            io.to(lobbyId).emit(GAME_EVENT.GAME_START, {
              userFirst: userFirst.username,
              userSecond: userSecond.username,
              boardSize: row
            });
            console.log("Worked");
          }
        }

      }
    });


    socket.on(GAME_EVENT.SEND_MOVE, ({move}) => {
      if (socket.gameRoom && socket.user) {
        console.log("User sent: " + socket.user.username);
        const lobbyId = socket.gameRoom.lobbyId;
        const thisUser = socket.user;
        let thisTurn = userTurn.get(lobbyId);
        let history = histories.get(lobbyId);
        if (checkHistory(history, move) && thisTurn === thisUser.username) {
          // set userTurn

          const {player1, player2} = lobbies[lobbyId].getPlayers();
          if (player1 && player2) {
            // Two players are still in the lobby
            thisTurn = (player1.username === thisTurn) ? player2.username : player1.username;
          } else if (player1 || player2) {
            //One player left
            const p1 = ready.get(lobbyId)[0];
            const p2 = ready.get(lobbyId)[1];
            thisTurn = (p1.username === thisTurn) ? p2.username : p1.username;
          }
          userTurn.set(lobbyId, thisTurn);

          history.push(move);
          histories.set(lobbyId, history);

          const winSquares = gameServices.calculateWinner(history, move, row);
          if (winSquares) {
            console.log("Game end!");
            gameServices.saveGame(lobbyId, history, thisUser.username, chats[lobbyId]);
            userTurn.set(lobbyId, undefined);
            delete lobbies[lobbyId];
            io.to(lobbyId).emit(GAME_EVENT.GAME_END, {
              newHistory: history,
              userWin: thisUser.username,
              winChain: winSquares,
              boardSize: row
            });
          } else {
            if (history.length === row*row) {
              // Draw
              gameServices.saveGame(lobbyId, history, "Draw", chats[lobbyId]);
              io.to(lobbyId).emit(GAME_EVENT.GAME_END, {
                newHistory: history,
                userWin: "Draw",
                winChain: null,
                boardSize: row
              });
            }
            else {
            console.log("Send move to client!");
            io.to(lobbyId).emit(GAME_EVENT.SEND_MOVE, {newHistory: history, userTurn: thisTurn, boardSize: row});
            }
          }
        }
      }
    });

    socket.on(HOME_EVENT.GET_LOBBIES, ({}) => {
      const keys = Object.keys(lobbies);
      const values = Object.values(lobbies);
      socket.emit(HOME_EVENT.GET_LOBBIES, {lobbiesID: keys, lobbies: values})
    });


  });
}

const find = (userList, user) => {
  for (let i = 0; i < userList.length; i++) {
    if (userList[i].email === user.email) {
      return true;
    }
  }
  return false;
}

const findCompetitor = (lobbies, user) => {
  const roomIDs = Object.keys(lobbies);
  for (let roomID of roomIDs) {
    const lobby = lobbies[roomIDs];
    console.log(lobby);
    const {player1, player2} = lobby.getPlayers();
    {
      if (!player1 || !player2) {
        const competitor = player1 || player2;
        if (Math.abs(competitor.rating - user.rating) <= RATING_OFFSET) {
          return {lobby, competitor};
        }
      }
    }
  }
  return null;
}