const USER_EVENT = {
  ONLINE: 'user/online',
  OFFLINE: 'user/offline',
};

const LOBBY_EVENT = {
  CREATE_LOBBY: 'lobby/create',
  JOIN_LOBBY: 'lobby/join',
  LIST_LOBBY: 'lobby/list',
  NEW_LOBBY: 'lobby/new',
  DELETE_LOBBY: 'lobby/delete',
  LEAVE_LOBBY: 'lobby/leave',
  LOBBY_INFO: 'lobby/info',
  INVITE: 'lobby/invite'
};

const GAME_EVENT = {
  GAME_READY: 'game/ready',
  GAME_START: 'game/start',
  SEND_MOVE: 'game/send',
  GAME_END: 'game/end'
};
const HOME_EVENT = {
  GET_LOBBIES: 'home/lobbies',
}

const REPLAY_EVENT = {
  GET_LOBBIES: 'replay/lobbies',

}

const LIST_ONLINE_USER_EVENT = 'onlineUserList';

const CHAT_EVENT = {
  RECEIVE_MESSAGE: 'chat/ClientToServerMessage',
  SEND_MESSAGE: 'chat/ServerToClientMessage'
}


module.exports = { USER_EVENT, LIST_ONLINE_USER_EVENT, LOBBY_EVENT, CHAT_EVENT, GAME_EVENT, HOME_EVENT,REPLAY_EVENT };
