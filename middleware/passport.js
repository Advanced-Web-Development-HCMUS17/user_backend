require('dotenv').config();
const passport = require("passport");
const passportjwt = require("passport-jwt");
const bcrypt = require("bcryptjs");
const LocalStrategy = require("passport-local").Strategy;
const JWTStrategy = require("passport-jwt").Strategy;

const {User, ROLE} = require('../models/userModel');

passport.use('jwt', new JWTStrategy(
  {
    jwtFromRequest: passportjwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRETKEY
  }
  , async (payload, done) => {
    console.log("payload received", payload);
    try {
      const user = await User.findById(payload.sub);
      if (user && user.role !== ROLE.BANNED)
        return done(null, user);
      return done(null, false);
    } catch (error) {
      return done(error);
    }
  }));

passport.use('local', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  console.log(email);
  console.log(password);
  try {
    const user = await User.findOne({email}).select('+password');
    if (user && bcrypt.compareSync(password, user.password))
      return done(null, user);
    return done(null, false);
  } catch (error) {
    return done(error);
  }
}));

passport.use('adminJwt', new JWTStrategy(
  {
    jwtFromRequest: passportjwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRETKEY
  },
  async (payload, done) => {
    try {
      const user = await User.findOne({_id: payload.sub._id}).select('+password');
      if (user && user.role !== ROLE.ADMIN)
        return done(null, user);
      return done(null, false);
    } catch (error) {
      return done(error)
    }
  }
))

module.exports = passport;
