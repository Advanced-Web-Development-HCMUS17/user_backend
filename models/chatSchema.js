const mongoose = require('mongoose');
const {UserSchema} = require('./userModel');

const ChatSchema = new mongoose.Schema({
  user: {
    type: UserSchema,
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