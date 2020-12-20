const router = require('express').Router();
const controller = require('../controllers/game-controller.js');






router.post('/save',controller.save);
router.post('/create',controller.create);

module.exports = router;