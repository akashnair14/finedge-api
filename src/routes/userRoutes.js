const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.post('/', userController.register);
router.patch('/:id', auth, userController.update);
router.delete('/:id', auth, userController.delete);

module.exports = router;

