const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const session = require('express-session');
const { config } = require('dotenv');
const path = require('path');
const fs = require('fs');
const dbConnection = require('./config/database');
const authRoutes = require('./auth/authRoutes');

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
  })
);

app.use('/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Authentication server running on http://localhost:${PORT}`);
});
client.commands = new Collection();
const prefix = process.env.PREFIX;

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Serving in ${client.guilds.cache.size} servers`);
});

client.on('messageCreate', async message => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

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

async function startup() {
  try {
    await dbConnection.connectDB();
    console.log('Connected to MongoDB');
   
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1); // Exit if database connection fails
  }
}

startup();
