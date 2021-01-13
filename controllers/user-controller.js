require('dotenv').config();
const {User, ROLE} = require('../models/userModel');
const userVerifyModel = require('../models/userVerifyModel');
const Game = require('../models/gameModel');
const tokenService = require('../services/token-service');
const mailService = require('../services/mail-service');
const FormData = require('form-data');
const axios = require("axios");

const CLIENT_URL = process.env.CLIENT_URL;
const SERVER_URL = process.env.SERVER_URL;

exports.register = async (req, res) => {
  let {username, email, password} = req.body;
  if (!username) username = email;

  if (await User.findOne({email: email}))
    return res.status(400).send("Email is already taken.");

  const newUser = new User({username: username, email: email, password: password});
  let savedUser = await newUser.save();
  if (!savedUser)
    return res.status(500).send("Error occur when saving user.");
  let savedCode = await userVerifyModel.findOne({ID: savedUser._id});
  if (!savedCode) {
    const newCode = new userVerifyModel({ID: savedUser._id, secretCode: tokenService.sign(savedUser._id)});
    savedCode = await newCode.save();
  }

  const mailContent = `<p>Please use the following link within the next 15 minutes to activate your account: <strong><a href="${SERVER_URL}/users/verification/verify-account/${savedCode.ID}/${savedCode.secretCode}" target="_blank">Link</a></strong></p>`;
  await mailService.send(savedUser.email, "Verify your email", mailContent);
  res.redirect(201, CLIENT_URL + "/login");
}

exports.verify = async (req, res) => {
  const {userId, secretCode} = req.params;

  if (!userId || !secretCode)
    return res.status(400).send("Bad request");

  const isValid = await userVerifyModel.findOne({ID: userId, secretCode: secretCode});
  if (!isValid)
    return res.send(404).send("Not found");

  await User.findByIdAndUpdate(userId, {"isVerified": true});
  await userVerifyModel.findOneAndDelete({ID: userId, secretCode: secretCode});
  res.redirect(CLIENT_URL + "/login");
}

exports.login = async (req, res) => {
  if (!req.user.isVerified)
    return res.status(400).send("Account has not been verified");

  let user = req.user;
  if (user.role === ROLE.BANNED)
    return res.status(403).send("Account has been blocked");

  user.password = undefined;
  res.status(200).send({token: tokenService.sign(user), userInfo: user});
}

exports.loginUsingOAuth2 = async (req, res) => {
  if (!req.user)
    return res.redirect(CLIENT_URL + '/login');
  req.user.password = undefined;
  res.redirect(`${CLIENT_URL}/login/${tokenService.sign(req.user)}`);
}

exports.resetPassword = async (req, res) => {
  const {email} = req.body;
  if (!email)
    return res.status(400).send("Bad request");

  const user = await User.findOne({email: email});
  if (!user)
    return res.status(404).send("Account not exist");

  let savedCode = await userVerifyModel.findOne({ID: user.email});
  if (savedCode) {
    const newCode = new userVerifyModel({ID: user.email, secretCode: tokenService.sign(user.email)});
    savedCode = await newCode.save();
  }

  const mailContent = `<p>Please use the following link within the next 15 minutes to reset password: <strong><a href="${CLIENT_URL}/reset-password/${savedCode.ID}/${savedCode.secretCode}" target="_blank">Link</a></strong></p>`;
  await mailService.send(user.email, "Reset password request", mailContent);
  res.status(200).send("Success");
}

exports.updatePassword = async (req, res) => {
  const {email, secretCode, newPassword} = req.body;

  if (!email || !secretCode || !newPassword)
    return res.status(400).send("Bad request");

  const isValid = await userVerifyModel.findOne({ID: email, secretCode: secretCode});
  if (!isValid)
    return res.status(404).send("Reset password request was expired");

  await User.findOneAndUpdate({email: email}, {password: newPassword});
  await userVerifyModel.findOneAndDelete({ID: email, secretCode: secretCode});
  res.status(200).send("Success");
}

exports.getMatchHistory = async (req, res) => {
  try {
    const user = req.user;
    const games = await Game.find().or([{user1: user.username}, {user2: user.username}]).exec();
    return res.status(200).json({user: user, games: games});
  } catch (e) {
    console.log(e);
    return res.status(500).json({message: "Can't connect to database"});
  }
}

exports.updateAvatar = async (req, res) => {
  if (!req.file)
    return res.status(400).send("Bad request");
  const formData = new FormData();
  formData.append('key', process.env.IMGBB_KEY);
  formData.append('image', Buffer.from(req.file.buffer).toString('base64'));
  try {
    const response = await axios.post('https://api.imgbb.com/1/upload', formData, {headers: formData.getHeaders()});
    const updatedUser = await User.findOneAndUpdate({email: req.user.email}, {avatar: response.data.data.display_url}, {new: true});
    res.status(200).json(updatedUser);
  } catch (e) {
    console.log(e);
    res.status(500).send("Can't upload image");
  }
}