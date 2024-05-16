import {db} from "../app.js";
import { msgChannel } from "../utils/msg.js";
import dotenv from 'dotenv';
import players from '../data/players.json' assert { type: 'json' };
import { Client, Events, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, transformResolved, bold} from 'discord.js';


dotenv.config();

const LOL_API_KEY = process.env.LOL_API_TOKEN
const REGION_URL = 'https://asia.api.riotgames.com'
const MATCH_REGION_URL = 'https://oc1.api.riotgames.com'

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


/** Grab specific user data within a given match
*/
const grabParticipantData = (puuid, data) => {
    for (const participant of data.participants) {
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

/** Check if a given user is currently in a League match
 *  if they are print username, gamemode, and duration
*/
export const isInLeagueGame = async(message, user) => {
    // const id = await findMatchingID(players, user);
    // console.log(id);
    // if (!id) {
    //     msgChannel("Invalid username");
    //     return 0;
    // }

    // use this while testing 
    const id = await getID('Frank Zane', 'Doner');
    const requestUrl = `${MATCH_REGION_URL}/lol/spectator/v5/active-games/by-summoner/${id}/?api_key=${LOL_API_KEY}`;
    console.log(id);
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

        // Match data as variables
        
        const gameType = data.gameType;
        const gameMode = data.gameMode;
        const gameLength = data.gameLength;
        const gameId = data.gameId;
        const userData = grabParticipantData(id, data);
        const userName = userData.riotId;
        // Calculate minutes and seconds for display
        const gameMinutes = Math.floor(gameLength / 60);
        const gameSeconds = gameLength - gameMinutes * 60;
        let gameTime = '';
        
        // Loading screen check     
        if (gameMinutes < 0) {
            gameTime = "Loading Screen";
        }

        else {
            gameTime = `${gameMinutes} minutes and ${gameSeconds} seconds`;           
        }

        const msg = `Username: ${userName} \nGame Mode: ${gameMode} \nGame Duration: ${gameTime}\n Would like you like to bet?`;

        const betWin = new ButtonBuilder()
            .setCustomId('win')
            .setLabel('Bet on a Win')
            .setStyle(ButtonStyle.Success);

        const betLoss = new ButtonBuilder()
            .setCustomId('loss')
            .setLabel('Bet on a Loss')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder()
            .addComponents(betWin, betLoss);

        await message.channel.send({
            content: msg,
            components: [row]
        });

        return gameId;

    } catch(error) {
        console.error("Error:", error);
        console.log("If 403 unauth check LOL api key");
        msgChannel('oops bug');
    }
}

export default isInLeagueGame;