const router = require('express').Router();
const passport = require('../middleware/passport');
const controller = require('../controllers/user-controller');

router.post('/register', controller.register);
router.post('/login', passport.authenticate('local', {session: false}), controller.login);
router.get('/get-user', controller.getUser);

module.exports = router;