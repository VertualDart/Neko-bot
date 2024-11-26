const express = require('express');
const { handleLogin, handleCallback } = require('./authController');

const router = express.Router();

// Define routes
router.get('/login', handleLogin);
router.get('/callback', handleCallback);

module.exports = router;
