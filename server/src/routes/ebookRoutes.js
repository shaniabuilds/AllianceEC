const express = require('express');
const { getAllEbooks, seedEbooks } = require('../controllers/ebookController');

const router = express.Router();

router.get('/', getAllEbooks);
router.post('/seed', seedEbooks);

module.exports = router;
