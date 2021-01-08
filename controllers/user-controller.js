require('dotenv').config();
const {User} = require('../models/userModel');
const userVerifyModel = require('../models/userVerifyModel');
const tokenService = require('../services/token-service');
const mailService = require('../services/mail-service');

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

  const secretCode = tokenService.sign(savedUser._id);
  const verifyData = new userVerifyModel({ID: savedUser._id, secretCode: secretCode});
  await verifyData.save();

  const mailContent = `<p>Please use the following link within the next 15 minutes to activate your account: <strong><a href="${SERVER_URL}/users/verification/verify-account/${savedUser._id}/${secretCode}" target="_blank">Link</a></strong></p>`;
  await mailService.send(savedUser.email, "Verify your email", mailContent);
  res.redirect(CLIENT_URL + "/login", 201);
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
    return res.status(403).send("Account has not been verified");
  let user = req.user;
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

  console.log(user);
  const secretCode = tokenService.sign(user.email);
  const verifyData = new userVerifyModel({ID: user.email, secretCode: secretCode});
  await verifyData.save();

  const mailContent = `<p>Please use the following link within the next 15 minutes to reset password: <strong><a href="${CLIENT_URL}/reset-password/${user.email}/${secretCode}" target="_blank">Link</a></strong></p>`;
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