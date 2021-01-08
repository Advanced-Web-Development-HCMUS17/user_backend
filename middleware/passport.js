require('dotenv').config();
const passport = require("passport");
const passportjwt = require("passport-jwt");
const bcrypt = require("bcryptjs");
const LocalStrategy = require("passport-local").Strategy;
const JWTStrategy = require("passport-jwt").Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;


const {User, ROLE} = require('../models/userModel');
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
  try {
    const user = await User.findOne({email}).select('+password');
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
    let user = await User.findOne({"email": userData.email});
    if (user)
      return done(null, user);
    else {
      const newUser = new User({
        "username": userData.name,
        "email": userData.email,
        "password": `${userData.sub}+!$%${userData.email}`,
        "isVerified": true,
      });
      user = await newUser.save();
      if (user.id) {
        return done(null, user);
      }
      return done(null, false);
    }
  }
));

passport.use('facebook', new FacebookStrategy({
  clientID: process.env.FACEBOOK_CLIENT_ID,
  clientSecret: process.env.FACEBOOK_CLIENT_SECRECT,
  callbackURL: process.env.FACEBOOK_CALLBACK_URL,
  profileFields: ['id', 'displayName', 'email', 'first_name', 'last_name', 'middle_name']
}, async function (accessToken, refreshToken, profile, done) {
  const userData = profile._json;
  let user = await User.findOne({"email": userData.email});
  if (user)
    return done(null, user);
  else {
    const newUser = new User({
      "username": userData.name,
      "email": userData.email,
      "password": `${userData.id}+!$%${userData.email}`,
      "isVerified": true,
    });
    user = await newUser.save();
    if (user.id) {
      return done(null, user);
    }
    return done(null, false);
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
      if (user && user.role === ROLE.ADMIN)
        return done(null, user);
      return done(null, false);
    } catch (error) {
      return done(error)
    }
  }
));

passport.use('adminLocal', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await User.findOne({email}).select('+password');
    if (user && bcrypt.compareSync(password, user.password) && user.role === ROLE.ADMIN)
      return done(null, user);
    return done(null, false);
  } catch (error) {
    return done(error);
  }
}));


module.exports = passport;