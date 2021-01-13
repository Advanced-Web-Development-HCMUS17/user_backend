const router = require('express').Router();
const multer = require('multer');
const storage = multer.memoryStorage()
const upload = multer({storage: storage})
const passport = require('../middleware/passport');
const controller = require('../controllers/user-controller');
const Game = require('../models/gameModel');

router.post('/register', controller.register);
router.get('/verification/verify-account/:userId/:secretCode', controller.verify);
router.post('/login', passport.authenticate('local', {session: false}), controller.login);
router.get('/google', passport.authenticate('google', {session: false, scope: ['profile', 'email']}));
router.get('/google/redirect', passport.authenticate('google', {failureRedirect: '/users/login'}), controller.loginUsingOAuth2);
router.get('/facebook', passport.authenticate('facebook', {scope: ['email']}));
router.get('/facebook/redirect', passport.authenticate('facebook', {failureRedirect: '/users/login'}), controller.loginUsingOAuth2);
router.post('/reset-password/request/', controller.resetPassword);
router.post('/reset-password/update/', controller.updatePassword);
router.get('/info', passport.authenticate('jwt', {session: false}), async (req, res, next) => {
  res.json(req.user);
});
router.get('/saved-games', passport.authenticate('jwt', {session: false}), controller.getMatchHistory);
router.post('/update/avatar', passport.authenticate('jwt', {session: false}), upload.single('avatar'), controller.updateAvatar);

router.get('/game', passport.authenticate('jwt', {session: false}),
  async (req, res, next) => {
    const pageIndex = req.query.pageIndex ? req.query.pageIndex : 1;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
    const skip = pageSize * (pageIndex - 1);
    const userId = req.user._id;
    const games = await Game.find({$or: [{"user1._id": userId}, {"user2._id": userId}]}).limit(pageSize).skip(skip).lean();
    res.json(games);
  });

router.get('/game/:gameId', async (req, res) => {
  const {gameId} = req.params;
  console.log('gameId: ',gameId);
  const game = await Game.findById(gameId).lean();
  if (game) {
    res.json(game);
  } else {
    res.status(404).send();
  }
});


module.exports = router;
