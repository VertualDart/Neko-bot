const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const session = require('express-session');
const { config } = require('dotenv');
const path = require('path');
const fs = require('fs');
const dbConnection = require('./config/database'); // Import the database connection
const authRoutes = require('./auth/authRoutes'); // Import authentication routes

config(); // Load environment variables

// Initialize bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Initialize Express server
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
  })
);

// Use authentication routes
app.use('/auth', authRoutes);

// Start the Express server
app.listen(PORT, () => {
  console.log(`Authentication server running on http://localhost:${PORT}`);
});

// Initialize the commands collection
client.commands = new Collection();
const prefix = process.env.PREFIX;

// Load commands dynamically
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

// Event: Bot Ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Serving in ${client.guilds.cache.size} servers`);
});

// Event: Message Create (Command Handler)
client.on('messageCreate', async message => {
  // Ignore bot messages and messages without prefix
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  // Split into command and arguments
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  // Get command
  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (error) {
    console.error('Error executing command:', error);
    message.reply({
      content: 'There was an error executing that command!',
    });
  }
});

// Connect to the database and start the bot
async function startup() {
  try {
    await dbConnection.connectDB(); // Connect to the database
    console.log('Connected to MongoDB');
    
    // Start the bot
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1); // Exit if database connection fails
  }
}

startup(); // Initialize everything
