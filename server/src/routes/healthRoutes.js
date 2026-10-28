const express = require('express');
const mongoose = require('mongoose');
const { sendSuccess } = require('../utils/apiResponse');

const router = express.Router();

router.get('/health', (req, res) => {
  const dbStatusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  const dbState = dbStatusMap[mongoose.connection.readyState] || 'Unknown';

  sendSuccess(res, 200, 'E-Learning Enterprise API is healthy', {
    uptime: `${Math.floor(process.uptime())}s`,
    database: {
      status: dbState,
      name: mongoose.connection.name || 'N/A'
    },
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString()
  });
});

module.exports = router;
