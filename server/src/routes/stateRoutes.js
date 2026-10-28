const express = require('express');
const { getAllStates, seedStates } = require('../controllers/stateController');

const router = express.Router();

router.get('/', getAllStates);
router.post('/seed', seedStates);

module.exports = router;
