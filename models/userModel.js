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
    //required: true,
    select: false,
    default: ""
  },
  email: {
    type: String,
    require: true,
    unique: true,
  },
  rating: {
    type: Number,
    required: true,
    default: 1000
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
});

const UserSchema_nopw = new mongoose.Schema({
  username: {
    type: String,
  },
  email: {
    type: String,
    require: true,
  },
  rating: {
    type: Number,
  },
  role: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
  },
});

UserSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, parseInt(process.env.BCRYPT_SALT_LENGTH));
  }
  next();
})

UserSchema.pre('update', async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, parseInt(process.env.BCRYPT_SALT_LENGTH));
  }
  next();
})


User = mongoose.model("user", UserSchema);
module.exports = {User,ROLE, UserSchema};
