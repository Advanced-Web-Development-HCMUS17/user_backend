require('dotenv').config();
const userModel = require('../models/userModel');
const tokenService = require('../services/token-service');

exports.register = async (req, res) => {
  let {username, email, password} = req.body;
  if (!username) username = email;

  if (await userModel.findOne({email: email})) {
    res.status(400).json({message: "Email is already taken."});
    return;
  }
  const newUser = new userModel({username: username, email: email, password: password});
  let savedUser = await newUser.save();
  savedUser.password = undefined;
  if (savedUser._id) {
    res.status(201).json({message: "Success"});
  } else {
    res.status(500).json({message: "Error when saving user."});
  }
}

exports.login = async (req, res) => {
  if (req.isAuthenticated()) {
    console.log(req.user);
    req.user.password = undefined;
    const token = tokenService.sign(req.user);
    res.status(200).send({token: token, userInfo: req.user});
  } else {
    res.status(500).send("Invalid user.");
  }
}

exports.loginWithGoogle = async (req, res) => {
  if (req.user) {
    req.user.password = undefined;
    res.redirect(`${process.env.CLIENT_URL}/login?token=${tokenService.sign(req.user)}`);
  } else {
    res.redirect(`${process.env.CLIENT_URL}/login`);
  }
}