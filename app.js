// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits} = require('discord.js');
require('dotenv').config()

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent,GatewayIntentBits.GuildVoiceStates] });

// When the client is ready, run this code (only once).
client.once(Events.ClientReady, readyClient => {
	console.log(`Bot is in! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client.login(process.env.BOT_TOKEN);