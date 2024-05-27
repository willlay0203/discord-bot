import dotenv from 'dotenv';
import { Client, Events, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, transformResolved, bold, ModalBuilder, TextInputBuilder, TextInputStyle, time} from 'discord.js';
import { MongoClient, ServerApiVersion } from 'mongodb';
import getPoints from './commands/getPoints.js';
import {addTimePoints, addPoints, removeTenPoints } from './utils/points.js';
import createEmbed from './features/treasure.js';
import { isInLeagueGame, didWin, fiveMinuteCheck } from './commands/getMatch.js'
import { handleBet } from './features/gamble.js';
import { msgChannel, createBetModal } from './utils/msg.js';

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

let liveGameDetails = {
    gameId: '',
    userId: '',
    membersBet: []
};

bot.on("messageCreate", async (message) => {
    const commandRegex = /^!(\w+)\s*(\w+)?/; 
    const content = message.content.match(commandRegex);

    if (content) {
        const command = content[1];
        const argument = content[2] || null;

        if (command === "points") { getPoints(message)};
        
        // needs ingame + a user (eg harry)
        // can only have one bet in progress at a time
        // if a gameid has been defined don't allow another
        if (command === "ingame") { 
            if (argument == null) {
                msgChannel("Please input a user (ie !ingame harry)");
                return;
            }

            if (liveGameDetails.gameId != '') {
                msgChannel("There is already a bet in progress!");
                return;
            }

            try {
                const leagueDetails = await isInLeagueGame(message, argument);

                if (leagueDetails != 0) {
                    liveGameDetails.gameId = `OC1_${leagueDetails.gameId}`;
                    liveGameDetails.userId = leagueDetails.id;
                }

                console.log(`${liveGameDetails.gameId} and ${liveGameDetails.userId}`);
            } catch (error) {
                console.error("Error fetching game ID", error);
            }
        }
    }
})

bot.on("interactionCreate", async (interaction) => {
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

        setTimeout( async () => await interaction.deleteReply(), 120000)
    }

    // gamble features
    if (interaction.customId === "win" || interaction.customId === "loss") {
        let member = interaction.member;

        // check that match id exists
        if (liveGameDetails.gameId === '') {
            interaction.reply(`Match has already ended`);
            return;
        }

        // check that the game hasnt exceeded 5 minutes
        const timeCheck = await fiveMinuteCheck(liveGameDetails.gameId)
        if (!timeCheck) {
            interaction.reply(`Match has already exceeded 5 minutes`);
            return;
        }

        // one bet per match id
        if (liveGameDetails.membersBet.includes(member.id)) {
            interaction.reply(`${bold(member.user.displayName)} you've already bet on this match`);
            return;
        };

    liveGameDetails.membersBet.push(member.id);
    console.log(`${member.displayName}  has bet on match ${liveGameDetails.gameId}`);

    const betModal = createBetModal();
    await interaction.showModal(betModal);
    
    const filter = i => i.customId === 'betAmount' && i.user.id === interaction.user.id;
    
    // modal input
    const betAmount = await new Promise((resolve, reject) => {
        interaction.client.once('interactionCreate', async (modalInteraction) => {
            if (!filter(modalInteraction)) return reject('Invalid interaction');
    
            try {
                const betAmount = parseInt(modalInteraction.fields.getTextInputValue('betAmountInput'));
    
                if (isNaN(betAmount) || betAmount <= 0) {
                    await modalInteraction.reply('Please enter a valid amount.');
                    return reject('Invalid amount');
                } else {
                    await modalInteraction.reply({content: 'Placing bet..', ephemeral: true} );
                    resolve(betAmount);
                }
            } catch (error) {
                modalInteraction.followUp('An error occurred while processing your bet.');
                reject(error);
            }
        });
    });

    // Pass to gamble.js to handle the bet
    try {
        const betResult = await handleBet(interaction, liveGameDetails.gameId, liveGameDetails.userId, betAmount);
    
        if (betResult) {
            const msg = `(${bold(member.user.displayName)} won ${betAmount * 2} petar points)`;
            msgChannel(msg);
            // await interaction.followUp(`${bold(member.user.displayName)} won ${betAmount * 2} petar points`);
            console.log(`${member.user.displayName} Bet won`);

        } else {
            const msg = `(${bold(member.user.displayName)} lost ${betAmount} petar points)`;
            msgChannel(msg);
            // await interaction.followUp(`${bold(member.user.displayName)} lost ${betAmount} petar points`);
            console.log(`${member.user.displayName} Bet lost`);
        }
    
        // Reset liveGameDetails
        liveGameDetails.userId = '';
        liveGameDetails.gameId = '';
        liveGameDetails.membersBet = [];
    
    } catch (error) {
        console.error('Error handling bet:', error);
        await interaction.followUp(`An error occurred while processing your bet. Please try again later.`);
    }
}}

)

bot.login(process.env.BOT_TOKEN);