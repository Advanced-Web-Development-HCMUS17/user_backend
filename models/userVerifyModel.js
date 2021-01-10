const mongoose = require('mongoose');

const userVerifySchema = new mongoose.Schema({
  ID: {
    type: String,
    required: true,
    unique: true,
  },
  secretCode: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: 900 },//Expired after 15 minutes
  }
});

module.exports = UserVerify = mongoose.model("userVerify", userVerifySchema);