import {db} from "../app.js";
import { msgChannel } from "../utils/msg.js";
import dotenv from 'dotenv';
import players from '../data/players.json' assert { type: 'json' };
import { Client, Events, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, transformResolved, bold} from 'discord.js';


dotenv.config();

const LOL_API_KEY = process.env.LOL_API_TOKEN
const REGION_URL = 'https://asia.api.riotgames.com'
const MATCH_REGION_URL = 'https://oc1.api.riotgames.com'
const MATCHID_URL = 'https://sea.api.riotgames.com'
/** Grab PUUID for given summoner name + tag (ie steven#OCE)
*/
const getID = async (name, tag) => {
    const requestUrl = `${REGION_URL}/riot/account/v1/accounts/by-riot-id/${name}/${tag}?api_key=${LOL_API_KEY}`;
    try {
        const response = await fetch(requestUrl);

        if (!response.ok) {
            throw new Error(`Error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const puuid = data.puuid;
        return puuid;

    } catch(error) {
        console.error("Error:", error);
    }
}


/** Grab specific user data within an ongoing match
*/
const grabParticipantDataOngoing = (puuid, data) => {
    for (const participant of data.participants) {
        if (participant.puuid === puuid) {
            return participant;
        }
    }
    return null;
}

/** Grab specific user data within a given COMPLETED match
*/
const grabParticipantDataCompleted = (puuid, data) => {
    for (const participant of data.info.participants) {
        if (participant.puuid === puuid) {
            return participant;
        }
    }
}

/** Find matching ID in players.json (ie !ingame harry)
 *  find harry's inGameName + tag
*/
const findMatchingID = (data, user) => {
    for (const player of data.users) {
        if (player.name === user) {
            const id = getID(player.id, player.tag);
            return id;
        }
    }
}

export const didWin = async (match, user) => {
    const requestUrl = `${MATCHID_URL}/lol/match/v5/matches/${match}?api_key=${LOL_API_KEY}`;
    
    try {
        const response = await fetch(requestUrl);
        if (!response.ok) {
            throw new Error(`Error! status: ${response.status}`);
        }

        const matchData = await response.json();
        const participant = grabParticipantDataCompleted(user, matchData);

        if (!participant) {
            console.log("didWin - Participant not found");
            return false;
        }

        if (participant.win === true) {
            return 'win';
        }

        return 'loss';
    } catch (error) {
        console.error("Error:", error);
        return false;
    }
};

// Calculate minutes and seconds for display
const convertGameTime = async(gameLength) => {

        const gameMinutes = Math.floor(gameLength / 60);
        const gameSeconds = gameLength - gameMinutes * 60;
        let gameTime = ''
        
        if (gameLength < 0) {
            gameTime = "Loading Screen";
            return gameTime;
        }

        else {
            gameTime = `${gameMinutes} minutes and ${gameSeconds} seconds`;           
        }

        return gameTime;
}

/** Check if a given user is currently in a League match
 *  if they are print username, gamemode, and duration
*/
export const isInLeagueGame = async(message, user) => {
        const id = await findMatchingID(players, user);

        if (!id) {
            msgChannel("Invalid username");
            return 0;
        }

    // use this while testing 
    // const id = await getID('214', 'coe');
    const requestUrl = `${MATCH_REGION_URL}/lol/spectator/v5/active-games/by-summoner/${id}/?api_key=${LOL_API_KEY}`;
    try {
        const response = await fetch(requestUrl);

        if (!response.ok) {
            if (response.status == "404") {
                msgChannel("User is not in a game!");
                return 0;
            }

            else {
            throw new Error(`Error! status: ${response.status}`);
            }
        }

        const data = await response.json();
        const userData = grabParticipantDataOngoing(id, data);
        // Required match data as object

        let matchData = {
        gameType: data.gameType,
        gameMode: data.gameMode,
        gameLength: data.gameLength,
        gameId: data.gameId,
        userName: userData.riotId
        };

        const gameTime = await convertGameTime(matchData.gameLength);
        const msg = `**Username:** ${matchData.userName} \n**Game Mode:** ${matchData.gameMode} \n**Game Duration:** ${gameTime}\n`;
        console.log(data.gameLength);
        if (gameTime === 'Loading Screen') {
            await message.channel.send({
                content: msg,
            });
            return { gameId: matchData.gameId, id: id, gameTime: gameTime};
        }

        if (matchData.gameLength <= 180 || gameTime === 'Loading Screen') {
            const betWin = new ButtonBuilder()
                .setCustomId('win')
                .setLabel('Bet Win')
                .setStyle(ButtonStyle.Success);

            const betLoss = new ButtonBuilder()
                .setCustomId('loss')
                .setLabel('Bet Loss')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder()
                .addComponents(betWin, betLoss);

            await message.channel.send({
                    content: msg,
                    components: [row]
            });
        }

        else {
        msgChannel(msg);
    }

        return { gameId: matchData.gameId, id: id, gameTime: gameTime};

    } catch(error) {
        console.error("Error:", error);
        msgChannel('Error checking if the user is in game');
    }
}




// Check if a given game has ended
// Assume the game is over if the match data contains the game end timestamp
export const hasGameEnded = async (match) => {
    try {
        console.log(`Checking if game has ended for ${match}`);
        const requestUrl = `${MATCHID_URL}/lol/match/v5/matches/${match}/?api_key=${LOL_API_KEY}`;
        const response = await fetch(requestUrl);
        const data = await response.json();
        return data.info.gameEndTimestamp != null;
    } catch (error) {
        // Just need to catch to prevent a crash
        // console.error('Error fetching game status:', error);
        return false; 
        // Assume the game is not over if there's an error
    }
}

// Time check for gambling
// True if game length is less than 'time'
export const timeCheck = async (id, time) => {
    try {
        const requestUrl = `${MATCH_REGION_URL}/lol/spectator/v5/active-games/by-summoner/${id}/?api_key=${LOL_API_KEY}`;
        const response = await fetch(requestUrl);
        const data = await response.json();
        console.log(`Game is currently ${data.gameLength} seconds in progress`);
        if (data.gameLength < time) {
            return true;
        }

        return false;
    } catch (error) {
        // Just need to catch to prevent a crash
        // console.error('Error fetching game status:', error);
        return false; 
        // Assume the game is not over if there's an error
    }
}

export default {isInLeagueGame, hasGameEnded, timeCheck};