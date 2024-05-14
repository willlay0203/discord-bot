import {db} from "../app.js";
import { bold } from 'discord.js';
import { msgTestChannel } from "../lib/msg.js";
import dotenv from 'dotenv';
dotenv.config();

const LOL_API_KEY = process.env.LOL_API_TOKEN
const REGION_URL = 'https://asia.api.riotgames.com'
const MATCH_REGION_URL = 'https://oc1.api.riotgames.com'

/** Grab PUUID for given summoner name + tag (ie steven#OCE)
*/
const getID = async () => {
    const requestUrl = `${REGION_URL}/riot/account/v1/accounts/by-riot-id/proxysinged/oce?api_key=${LOL_API_KEY}`;

    try {
        const response = await fetch(requestUrl);

        if (!response.ok) {
            throw new Error(`Error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const puuid = data.puuid;
        console.log(data)
        msgTestChannel(puuid);

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
    const id = "W3XPSvMu8iGilEb1Jt9-PKPJjHQ_h9OMkIMq8emLCOTrwvpND-trePeBe1kRz1LDYRi-4f74DUPTdw"
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

        const msg = `Username: ${userName} \nGame Mode: ${gameMode} \nGame Duration: ${gameLength}`
        msgTestChannel(msg);

    } catch(error) {
        console.error("Error:", error);
    }
}

export default isInLeagueGame;