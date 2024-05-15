import {db} from "../app.js";
import { bold } from 'discord.js';
import { msgTestChannel } from "../utils/msg.js";
import dotenv from 'dotenv';
import players from '../data/players.json' assert { type: 'json' };
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
        if (participant.puuid == puuid) {
            return participant;
        }

    }
}

/** Find matching ID in players.json (ie !ingame harry)
 *  find harry's inGameName + tag
*/
const findMatchingID = (data, user) => {
    for (const player of data.users) {
        if (player.name == user) {
            const id = getID(player.id, player.tag);
            return id;
        }
    }
}

/** Check if a given user is currently in a League match
 *  if they are print username, gamemode, and duration
*/
export const isInLeagueGame = async(user) => {
    const id = await findMatchingID(players, user);

    if (!id) {
        msgTestChannel("Invalid username");
        return 0;
    }
    
    const requestUrl = `${MATCH_REGION_URL}/lol/spectator/v5/active-games/by-summoner/${id}/?api_key=${LOL_API_KEY}`;

    try {
        const response = await fetch(requestUrl);

        if (!response.ok) {
            if (response.status == "404") {
                msgTestChannel("User is not in a game!");
                return 0;
            }

            else {
            throw new Error(`Error! status: ${response.status}`);
            }
        }

        const data = await response.json();

        /** Match data as variables
        */
        const gameType = data.gameType;
        const gameMode = data.gameMode;
        const gameLength = data.gameLength;
        const userData = grabParticipantData(id, data);
        const userName = userData.riotId;

        /** Calculate minutes and seconds for display
        */
        const gameMinutes = Math.floor(gameLength / 60)
        const gameSeconds = gameLength - gameMinutes * 60
        let gameTime = ''
        
        /** Loading screen check
        */        
        if (gameMinutes < 0) {
            gameTime = "Loading Screen"
        }

        else {
            gameTime = `${gameMinutes} minutes and ${gameSeconds} seconds`           
        }

        const msg = `$bold{Username:} ${userName} \nGame Mode: ${gameMode} \nGame Duration: ${gameTime}`
        msgTestChannel(msg);

    } catch(error) {
        console.error("Error:", error);
        console.log("If 403 unauth check LOL api key")
        msgTestChannel('oops bug');
    }
}

export default isInLeagueGame;