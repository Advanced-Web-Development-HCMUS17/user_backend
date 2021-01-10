const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLE = {
  USER: "USER",
  ADMIN: "ADMIN",
  BANNED: "BANNED"
}

const UserSchema = new mongoose.Schema({
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
    default: "USER",
  },
  isVerified: {
    type: Boolean,
    required: true,
    default: false
  },
  avatar: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, parseInt(process.env.BCRYPT_SALT_LENGTH));
  }
  next();
})

UserSchema.pre('findOneAndUpdate', async function (next) {
  const user = this._update;
  if (user.password) {
    user.password = await bcrypt.hash(user.password, parseInt(process.env.BCRYPT_SALT_LENGTH));
  }
  next();
})

User = mongoose.model("user", UserSchema);
module.exports = {User, ROLE, UserSchema};

