import { getAllUsers } from '../db/getAllUsers.js';
import { bold } from 'discord.js';
import { msgChannel } from "../utils/msg.js";

/**
 * This command sends a sorted list of everyone
 * @param {string} message 
 */
export const points = async (message) => {
    const users = await getAllUsers();
    
    let msg = `${bold("Petar Points ranking")}\n`;
    users.forEach((user, index) => {
        msg += `${index + 1}: ${bold(user.displayName)}: ${user.points}\n`;
    });

    msgChannel(msg);
}


export default points;