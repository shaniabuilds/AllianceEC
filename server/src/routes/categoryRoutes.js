const express = require('express');
const { getAllCategories, seedCategories } = require('../controllers/categoryController');

const router = express.Router();

router.get('/', getAllCategories);
router.post('/seed', seedCategories);

module.exports = router;
