const mongoose = require('mongoose');
const {userSchema} = require('./userModel');

const ChatSchema = new mongoose.Schema({
  user: {
    type: userSchema,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  time: {
    type: Date,
    required: true,
  }
});

module.exports = ChatSchema;