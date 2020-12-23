const PLAYER_1 = "p1";
const PLAYER_2 = "p2";
const ROOM_PREFIX = "gameBoard_";

class Lobby {
  constructor(id) {
    this.id = id;
    this.player1 = null;
    this.player2 = null;
  }

  join(player) {

    const existedUser = this.player1 ? this.player1 : this.player2;

    if (existedUser && existedUser._id === player._id) return null;


    if (!this.player1) {
      this.player1 = player;
      return PLAYER_1;
    } else if (!this.player2) {
      this.player2 = player;
      return PLAYER_2;
    } else return null;
  }

  leave(player) {
    if (player === PLAYER_1) {
      this.player1 = null;
      return PLAYER_1;
    } else if (player === PLAYER_2) {
      this.player2 = null;
      return PLAYER_2;
    }
    return null;
  }

  getRoomName() {
    return ROOM_PREFIX + this.id;
  }
  getPlayers() {
    return { player1: this.player1, player2: this.player2 };
  }
}

module.exports = { PLAYER_1, Lobby, PLAYER_2 }
