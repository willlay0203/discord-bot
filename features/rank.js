import { msgChannel } from '../utils/msg.js';
import { getAllUsers } from '../db/getAllUsers.js';
import ranks from '../data/ranks.json' assert { type: 'json' };
import { bot } from '../app.js';

export async function sortRanks() { 
    let roles = await bot.guilds.cache.get("199749576851193856").roles.fetch()

    // Get all the users
    const users = await getAllUsers(); 
    // Check to prevent changing Chaosbringer0203 role
    users.splice(users.findIndex(item => item._id === '198248883942326272'), 1);
    
    // Go down the list of the users and assign ranking per quota of rank
    for (let i = 0; i < users.length; i++) {
        const channelId = "199749576851193856"; // This is the default channel
        const nitroRoleId = "585667937495416854";
        let user = await bot.guilds.cache.get(channelId).members.fetch(users[i]._id)
        let rolesToAdd = []
        let roleId;
        // This ensures nitro roles stay the same
        if (user.toJSON().roles.includes("585667937495416854")) {
            roleId = await roles.find(role => role.id == nitroRoleId)       
            rolesToAdd.push(roleId)
        }
        
        // Assigns role
        if (i == 0) {
            // Handles 1st
            roleId = await roles.find(role => role.name == ranks.ranks[0].name);
        } else if (i < 4) {
            // Handles 2nd to 4th
            roleId = await roles.find(role => role.name == ranks.ranks[1].name);
        } else if (i < 8) {
            // Handles 5th to 7th
            roleId = await roles.find(role => role.name == ranks.ranks[2].name);
        } else if (i < 13) {
            // Handles 8th to 12th
            roleId = await roles.find(role => role.name == ranks.ranks[3].name);
        } else {
            // Handles all others
            roleId = await roles.find(role => role.name == ranks.ranks[4].name);
        }
        
        rolesToAdd.push(roleId);
        user.roles.set(rolesToAdd);
    } 
    // Print confirmation message
    msgChannel(`Ranks have been updated! ${users[0].displayName} is pookie bear!!`)
}
