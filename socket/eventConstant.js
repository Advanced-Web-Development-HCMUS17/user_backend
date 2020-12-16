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
  SEND_MOVE: 'lobby/sendToClient',
  RECEIVE_MOVE: 'lobby/sendToServer'
}
const LIST_ONLINE_USER_EVENT = 'onlineUserList';
module.exports = {USER_EVENT, LIST_ONLINE_USER_EVENT, LOBBY_EVENT};
