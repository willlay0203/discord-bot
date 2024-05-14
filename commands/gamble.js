import {db} from "../app.js";
import { bold } from 'discord.js';
import { msgTestChannel } from "../lib/msg.js";
import dotenv from 'dotenv';
dotenv.config();

const LOL_API_KEY = process.env.LOL_API_TOKEN
const REGION_URL = 'https://asia.api.riotgames.com'
const MATCH_REGION_URL = 'https://oc1.api.riotgames.com'

/** To be moved to separate file later
*/
const harry = 'darkhunter360'

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

const grabParticipantData = (puuid, data) => {
    for (const participant of data.participants) {
        if (participant.puuid == puuid) {
            return participant;
        }

    }
}

/** Check if a given user is currently in a League match
*/
export const isInLeagueGame = async() => {
    const id = await getID(harry, 'oce');
    const requestUrl = `${MATCH_REGION_URL}/lol/spectator/v5/active-games/by-summoner/${id}/?api_key=${LOL_API_KEY}`;

    try {
        const response = await fetch(requestUrl);

        if (!response.ok) {
            throw new Error(`Error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const gameType = data.gameType;
        const gameMode = data.gameMode;
        const gameLength = data.gameLength;
        const userData = grabParticipantData(id, data);
        const userName = userData.riotId;

        const gameMinutes = Math.floor(gameLength / 60)
        const gameSeconds = gameLength - gameMinutes * 60

        const msg = `Username: ${userName} \nGame Mode: ${gameMode} \nGame Duration: ${gameMinutes} minutes and ${gameSeconds} seconds`
        msgTestChannel(msg);

    } catch(error) {
        console.error("Error:", error);
        msgTestChannel('User is not in a game!');
    }
}

export default isInLeagueGame;