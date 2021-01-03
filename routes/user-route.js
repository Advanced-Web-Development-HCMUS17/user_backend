const router = require('express').Router();
const passport = require('../middleware/passport');
const controller = require('../controllers/user-controller');


router.post('/register', controller.register);
router.post('/login', passport.authenticate('local', {session: false}), controller.login);
router.get('/google', passport.authenticate('google', {session: false, scope: ['profile', 'email']}));
router.get('/google/redirect', passport.authenticate('google', {failureRedirect: '/users/login'}), controller.loginWithGoogle);
router.get('/info', passport.authenticate('jwt', {session: false}), (req, res, next) => {
  res.json(req.user);
});


module.exports = router;
