const axios = require('axios');
const User = require('../models/UserInventory');

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

const handleLogin = (req, res) => {
  const discordAuthURL = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=identify`;
  res.redirect(discordAuthURL);
};
const handleCallback = async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('No code provided.');
  }

  try {
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const userData = userResponse.data;

    const existingUser = await User.findOne({ discordId: userData.id });
    if (!existingUser) {
      const newUser = new User({
        discordId: userData.id,
        username: userData.username,
      });
      await newUser.save();
    }

    res.send(`Welcome, ${userData.username}!`);
  } catch (error) {
    console.error('Error during Discord authentication:', error);
    res.status(500).send('Authentication failed.');
  }
};

module.exports = { handleLogin, handleCallback };
