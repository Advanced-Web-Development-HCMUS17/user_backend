require('dotenv').config();
const passport = require("passport");
const passportjwt = require("passport-jwt");
const bcrypt = require("bcryptjs");
const LocalStrategy = require("passport-local").Strategy;
const JWTStrategy = require("passport-jwt").Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const userModel = require('../models/userModel');

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use('jwt', new JWTStrategy(
  {
    jwtFromRequest: passportjwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRETKEY
  }
  , async (payload, done) => {
    console.log("payload received", payload);
    try {
      const user = await userModel.findById(payload.sub);
      if (user)
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
    const user = await userModel.findOne({email}).select('+password');
    if (user && bcrypt.compareSync(password, user.password))
      return done(null, user);
    return done(null, false);
  } catch (error) {
    return done(error);
  }
}));

passport.use('google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async function (accessToken, refreshToken, profile, done) {
    const userData = profile._json;
    console.log(userData);
    let user = await userModel.findOne({"email": userData.email});
    if (user)
      return done(null, user);
    else {
      const newUser = new userModel({
        "username": userData.name,
        "email": userData.email,
        "password": `${userData.sub}+!$%${userData.email}`
      });
      user = await newUser.save();
      if (user.id) {
        return done(null, user);
      }
      return done(null, false);
    }
  }
));

module.exports = passport;
