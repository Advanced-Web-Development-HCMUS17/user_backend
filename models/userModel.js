const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  email: {
    type: String,
    require: true,
    unique: true,
  },
  rating: {
    type: Number,
    required: true,
    default: 0
  },
  role: {
    type: String,
    required: true,
    default: "user",
  },
  isVerified: {
    type: Boolean,
    required: true,
    default: false
  },
});

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, parseInt(process.env.BCRYPT_SALT_LENGTH));
  }
  next();
})

userSchema.pre('update', async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, parseInt(process.env.BCRYPT_SALT_LENGTH));
  }
  next();
})

const userModel = mongoose.model("user", userSchema);
module.exports = {userSchema, userModel};
