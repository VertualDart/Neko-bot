const express = require('express');
const { handleLogin, handleCallback } = require('./authController');

const router = express.Router();

router.get('/login', handleLogin);
router.get('/callback', handleCallback);

module.exports = router;
