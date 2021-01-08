const router = require('express').Router();
const passport = require('../middleware/passport');
const controller = require('../controllers/user-controller');
const {User, ROLE} = require('../models/userModel');
const Game = require('../models/gameModel');

router.get('/user', async (req, res, next) => {
  const pageIndex = req.query.pageIndex ? Number(req.query.pageIndex) : 1;
  const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
  const skip = pageSize * (pageIndex - 1);
  const userList = await User.find().limit(pageSize).skip(skip).lean();
  res.json(userList);
});

router.get('/user/:userId', async (req, res, next) => {
  const userId = req.params.userId;

  const user = await User.findById(userId).lean();

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({message: "user not found"});
  }
});

router.get('/user/:userId/game',
  async (req, res, next) => {
    const userId = req.params.userId;
    const pageIndex = req.query.pageIndex ? req.query.pageIndex : 1;
    const pageSize = req.query.pageSize ? req.query.pageSize : 10;
    const skip = (pageIndex - 1) * pageSize;
    const games = await Game.find({$or: [{user1: userId}, {user2: userId}]}).limit(pageSize).skip(skip).lean();
    res.json(games);
  });

router.get('/user',
  async (req, res, next) => {
    const key = req.query.key;

    const regexKey = new RegExp(key, 'i');

    const users = await User.find({$or: [{username: regexKey}, {email: regexKey}]}).lean();
    res.json(users);
  });

router.put('/user/role',
  async (req, res, nesxt) => {
    const role = req.body.role;
    const userId = req.body.userId;
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

router.get('/game', async (req, res, next) => {
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

module.exports = router;
