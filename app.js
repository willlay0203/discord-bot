import dotenv from 'dotenv';
import { Client, Events, GatewayIntentBits, Collection } from 'discord.js';
import { MongoClient, ServerApiVersion } from 'mongodb';
import points from './commands/points.js';
import isInLeagueGame from './commands/gamble.js'

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
            addPoints(currTime, member);
        }
    } else {
        console.log(`Starting count for user ${member.user.displayName}`);
        users.set(member.id, currTime);
    }
})

bot.on("messageCreate", (message) => {
    const commandRegex = /^![^\s]+/; 
    const command = message.content.match(commandRegex)
    
    if (command == "!points") { points(message)};

    if (command == "!ingame") { isInLeagueGame(message);}

})

const addPoints = async (currTime, member) => {
    // 10 points per minute
    const points = Math.floor(((currTime - users.get(member.id)) / 1000) / 60) * 10;
    try {
        // Check if the user exists in the database
        const user = await db.db("points-db").collection("Users").findOne({_id: member.id});
        
        if (user === null) {
            db.db("points-db").collection("Users").insertOne({_id: member.id, displayName: member.user.displayName, points: points});
        } else {
            db.db("points-db").collection("Users").updateOne(
                { _id: member.id },
                { $inc: {points: points }}
            )
        }
        console.log(`Added ${points} points to ${member.user.displayName}`);
    } catch (error) {
        console.log(error)
    }
}

bot.login(process.env.BOT_TOKEN);