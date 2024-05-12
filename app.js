import dotenv from 'dotenv';
import { Client, Events, GatewayIntentBits, Collection } from 'discord.js';
import { MongoClient, ServerApiVersion } from 'mongodb';
import points from './commands/points.js';

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

    if (oldState.channel === null) {
        // If the member just joined a channel
        console.log(member.user.displayName + " joined a channel");
        users.set(member.id, currTime);
    } else if (newState.channel === null || member.voice.deaf || member.voice.mute) {
        // Member left the channel or goes on mute/deafen 
        console.log(member.user.displayName + " has left/muted/deafened");
        addPoints(currTime, member);
    } else if (oldState.channel == newState.channel && !oldState.member.voice.streaming && newState.member.streaming) {
        // If the member has just unmuted or undeafened
        console.log(`${member.user.displayName} moved channels or has stop or started streaming`);
        users.set(member.id, currTime);
    }
})

bot.on("messageCreate", (message) => {
    const commandRegex = /^![^\s]+/; 
    const command = message.content.match(commandRegex)
    
    if (command == "!points") { points(message)};
})

const addPoints = async (currTime, member) => {
    // 10 points per minute
    const points = Math.floor(((currTime - users.get(member.id)) / 1000) / 60) * 10;
    try {
        // Check if the user exists in the database
        const res = await db.db("points-db").collection("Users").findOneAndUpdate(
            { id: member.id },
            { $inc: {points: points }, $set: {displayName: member.user.displayName}},
            { returnDocument: 'after', upsert: true}
        );
        console.log(`Added ${points} points to ${res.displayName}`);
    } catch (error) {
        console.error("error updating");
    }
}

bot.login(process.env.BOT_TOKEN);