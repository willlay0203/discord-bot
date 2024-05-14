import dotenv from 'dotenv';
import { Client, Events, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder} from 'discord.js';
import { MongoClient, ServerApiVersion } from 'mongodb';
import getPoints from './commands/getPoints.js';
import addTimePoints from './utils/points.js';
import createEmbed from './features/treasure.js';

dotenv.config();
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
export const db = new MongoClient(process.env.DB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
});

export const bot = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent,GatewayIntentBits.GuildVoiceStates] });

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

    // If user joins a channel or goes on mute and deafen
    if (newState.channel === null || member.voice.deaf || member.voice.mute) {
        // Checks if you joined muted/deafened
        if (oldState.channel != null) {
            console.log(member.user.displayName + " has left or gone on muted/deafened");
            addTimePoints(currTime, member);
        }
    } else {
        console.log(`Starting count for user ${member.user.displayName}`);
        users.set(member.id, currTime);
    }
})

bot.on("messageCreate", (message) => {
    const commandRegex = /^![^\s]+/; 
    const command = message.content.match(commandRegex)
    
    if (command == "!points") { getPoints(message) };
})

setInterval(() => {
    createEmbed();
}, 5000)

bot.on("interactionCreate", (interaction) => {
    if (interaction.customId === "treasureButton") {
        let user = interaction.member.user.displayName;
        interaction.message.delete()
        interaction.message.channel.send(`${user} collected `)
        // user id = interaction.member.user.id
    }
})

bot.login(process.env.TEST_BOT_TOKEN);