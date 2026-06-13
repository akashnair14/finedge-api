const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { validateTransactionCreate, validateTransactionUpdate } = require('../middleware/validator');

router.post('/', validateTransactionCreate, transactionController.create);
router.get('/', transactionController.getAll);
router.get('/:id', transactionController.getById);
router.patch('/:id', validateTransactionUpdate, transactionController.update);
router.delete('/:id', transactionController.delete);

module.exports = router;

