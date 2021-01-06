const mongoose = require('mongoose');
const ChatMessage = require('./chatSchema');

const gameSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
  },
  user1: {
    type: String,
    required: true,
  },
  user2: {
    type: String,
    required: true,
  },
  history: [{
    type: Number,
  }],
  date: {
    type: Date,
  },
  winner: {
    type: String,
  },
  chat: {
    type: [ChatMessage],
    required: true,
    default: [],
  }
});

module.exports = Game = mongoose.model("game", gameSchema);