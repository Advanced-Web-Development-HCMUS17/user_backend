require('dotenv').config();
const router = require('express').Router();
const passport = require('../middleware/passport');
const {User, ROLE} = require('../models/userModel');
const userVerifyModel = require('../models/userVerifyModel');
const Game = require('../models/gameModel');
const tokenService = require('../services/token-service');
const mailService = require('../services/mail-service');

const CLIENT_URL = process.env.CLIENT_URL;

router.get('/user', passport.authenticate('adminJwt', {session: false}),
  async (req, res, next) => {
    const pageIndex = req.query.pageIndex ? Number(req.query.pageIndex) : 1;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
    const skip = pageSize * (pageIndex - 1);
    const userList = await User.find().limit(pageSize).skip(skip).lean();
    res.json(userList);
  });

router.get('/user/:userId', passport.authenticate('adminJwt', {session: false}),
  async (req, res, next) => {
    const userId = req.params.userId;

    const user = await User.findById(userId).lean();

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({message: "user not found"});
    }
  });

router.get('/user/:userId/game', passport.authenticate('adminJwt', {session: false}),
  async (req, res, next) => {
    const userId = req.params.userId;
    const pageIndex = req.query.pageIndex ? req.query.pageIndex : 1;
    const pageSize = req.query.pageSize ? req.query.pageSize : 10;
    const skip = (pageIndex - 1) * pageSize;
    const games = await Game.find({$or: [{"user1._id": userId}, {"user2._id": userId}]}).limit(pageSize).skip(skip).lean();
    res.json(games);
  });

router.get('/finduser', passport.authenticate('adminJwt', {session: false}),
  async (req, res, next) => {
    const key = req.query.key;

    const regexKey = new RegExp(key, 'i');

    const users = await User.find({$or: [{username: regexKey}, {email: regexKey}]}).lean();
    res.json(users);
  });

router.put('/user/:userId/role', passport.authenticate('adminJwt', {session: false}),
  async (req, res, nesxt) => {
    const role = req.body.role;
    const userId = req.params.userId;
    if (Object.values(ROLE).includes(role)) {
      const user = await User.findById(userId).lean();
      if (user) {
        const newUserInfo = await User.findByIdAndUpdate(userId, {role: role}).lean();
        res.status(200).json(newUserInfo);
      } else {
        res.status(404).json({
          message: "Can't find user"
        });
      }

    } else {
      res.status(400).json({
        message: "Wrong role type"
      });
    }
  });

router.get('/game', passport.authenticate('adminJwt', {session: false}),
  async (req, res, next) => {
    const pageIndex = req.query.pageIndex ? req.query.pageIndex : 1;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
    const skip = pageSize * (pageIndex - 1);
    const games = await Game.find().skip(skip).limit(pageSize).lean();
    res.json(games);
  });

router.get('/game/:gameId', async (req, res) => {
  const {gameId} = req.params;
  const game = await Game.findById(gameId).lean();
  if (game) {
    res.json(game);
  } else {
    res.status(404).send();
  }

});

router.post('/login', passport.authenticate('adminLocal', {session: false}), (req, res) => {
  let user = req.user;
  user.password = undefined;
  res.status(200).json({token: tokenService.sign(user), userInfo: user});
});

router.get('/info', passport.authenticate('adminJwt', {session: false}), (req, res) => {
  res.json(req.user);
});

router.post('/reset-password/request/', async (req, res, next) => {
  const {email} = req.body;
  if (!email)
    return res.status(400).json({message: "Bad request"});

  const user = await User.findOne({email: email});
  if (!user)
    return res.status(404).json({message: "Account not exist"});

  let savedCode = await userVerifyModel.findOne({ID: user.email});
  if (!savedCode) {
    const newCode = new userVerifyModel({ID: user.email, secretCode: tokenService.sign(user.email)});
    savedCode = await newCode.save();
  }
  const mailContent = `<p>Please use the following link within the next 15 minutes to reset password: <strong><a href="${CLIENT_URL}/reset-password/${savedCode.ID}/${savedCode.secretCode}" target="_blank">Link</a></strong></p>`;
  await mailService.send(user.email, "Reset password request", mailContent);
  res.status(200).json({message: "Success"});
});

router.post('/reset-password/update/', async (req, res, next) => {
  const {email, secretCode, newPassword} = req.body;

  if (!email || !secretCode || !newPassword)
    return res.status(400).json({message: "Bad request"});

  const isValid = await userVerifyModel.findOne({ID: email, secretCode: secretCode});
  if (!isValid)
    return res.status(404).json({message: "Update password request was invalid or expired"});

  await User.findOneAndUpdate({email: email}, {password: newPassword});
  await userVerifyModel.findOneAndDelete({ID: email, secretCode: secretCode});
  res.status(200).json({message: "Success"});
});

module.exports = router;
