import dotenv from 'dotenv';
import { Client, Events, GatewayIntentBits, Collection } from 'discord.js';
import { MongoClient, ServerApiVersion } from 'mongodb';
import points from './commands/points.js';
import addPoints from './lib/addPoints.js';
dotenv.config();
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
export const db = new MongoClient(process.env.DB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
});

const bot = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent,GatewayIntentBits.GuildVoiceStates] });

bot.once(Events.ClientReady, readyClient => {
	console.log(`Bot is in! Logged in as ${readyClient.user.tag}`);
});

let users = new Map();

bot.on('voiceStateUpdate', (oldState, newState) => {
    let member = oldState.member || newState.member;
    let currTime = new Date().getTime();

    if (users.get(member.id) == null) {
        users.set(member.id, currTime);
    }
    console.log(`Starting count for user ${member.user.displayName}`);
    // Member left the channel or goes on mute/deafen 
    if (newState.channel === null || member.voice.deaf || member.voice.mute) {
        console.log(member.user.displayName + " has left/muted/deafened");
        addPoints(currTime, member, users);
    }
    users.set(member.id, currTime);
})

bot.on("messageCreate", (message) => {
    const commandRegex = /^![^\s]+/; 
    const command = message.content.match(commandRegex)
    
    if (command == "!points") { points(message)};
})

bot.login(process.env.BOT_TOKEN);