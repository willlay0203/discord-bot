import dotenv from 'dotenv';
import { Client, Events, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, transformResolved, bold} from 'discord.js';
import { MongoClient, ServerApiVersion } from 'mongodb';
import getPoints from './commands/getPoints.js';
import addTimePoints, { addPoints } from './utils/points.js';
import createEmbed from './features/treasure.js';
import isInLeagueGame from './commands/gamble.js'
import { msgChannel } from './utils/msg.js';

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
            addTimePoints(currTime, member, users);
        }
    } else {
        console.log(`Starting count for user ${member.user.displayName}`);
        users.set(member.id, currTime);
    }
})

let treasureEventCounters = {
    remaining: 2,
    membersClicked: []
};

// This is to run periodic events
function eventTimer() {
    const minTime = 1200000; // 20min  
    const maxTime = 2400000; // 40min 
    const intervalTime = Math.random() * (maxTime - minTime) + minTime;

    console.log(`Next event in ${(intervalTime / (60 * 1000)).toFixed(2)} minutes`);

    setTimeout(() => {
        console.log("Treasure event started");
        // Reset
        treasureEventCounters = {
            remaining: 2,
            membersClicked: []
        };
        createEmbed(); // Start the interval again after sending the message
        eventTimer();
      }, intervalTime);
}
eventTimer()

bot.on("messageCreate", (message) => {
    const commandRegex = /^!(\w+)\s*(\w+)?/; 
    const content = message.content.match(commandRegex);

    if (content) {
        const command = content[1];
        const argument = content[2] || null;

        if (command === "points") { getPoints(message)};
        
        if (command === "ingame") { 
            if (argument == null) {
                msgChannel("Please input a user (ie !ingame harry)");
            }

            else {
            isInLeagueGame(argument);
        }

        }
    }

})

bot.on("interactionCreate", (interaction) => {
    // Treasure features
    if (interaction.customId === "treasureButton") {
        let member = interaction.member;
        let points = interaction.message.embeds[0].title.match(/CLICK COLLECT TO GET (\d+)PP/)[1];

        if (treasureEventCounters.membersClicked.includes(member.id)) {
            interaction.reply(`${bold(member.user.displayName)} you've already done it!`);
            return;
        };

        //Update the counter
        treasureEventCounters.remaining -= 1;
        treasureEventCounters.membersClicked.push(member.id)

        console.log(`${member.user.displayName} has clicked, remaining treasure ${treasureEventCounters.remaining}`);
        addPoints(parseInt((points)), member);
        interaction.reply(`${bold(member.user.displayName)} collected ${points}PP`);
        
        // Reset
        if (treasureEventCounters.remaining <= 0) {
            interaction.message.delete();
            treasureEventCounters.remaining = 2;
            treasureEventCounters.membersClicked = [];
        }
    }
})

bot.login(process.env.BOT_TOKEN);