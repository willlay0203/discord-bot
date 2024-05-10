require('dotenv').config()
// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, Collection} = require('discord.js');
const { MongoClient, ServerApiVersion } = require('mongodb');

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const db = new MongoClient(process.env.DB_URI, {
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
    const member = oldState.member || newState.member;
    
    // If the member was not in a channel before
    if (oldState.channel === null) {
        console.log(member.user.displayName + " joined a channel");
        users.set(member.id, new Date().getTime());
    } else {
        // Member left the channel
        console.log(member.user.displayName + " left a channel");
        const points = Math.floor((new Date().getTime() - users.get(member.id)) / 1000); // in seconds
        addPoints(points, member);
    }    
})

bot.on("messageCreate", (message) => {
    const commandRegex = /^![^\s]+/; 
    const command = message.content.match(commandRegex)
    const test = require('./commands/points.js')
    test()
    // if (command) {

    // }
})

async function addPoints(points, member) {
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
    } finally {
        await db.close();
    }
}

bot.login(process.env.BOT_TOKEN);

module.exports = db;