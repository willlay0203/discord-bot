import {EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder} from 'discord.js';
import { bot } from '../app.js';

export const createEmbed = () => {
    let points = Math.max(10 * (Math.floor(Math.random() * 20) + 2), 100);

    const treasureCollectButton = new ButtonBuilder()
        .setCustomId("treasureButton")
        .setLabel("COLLECT")
        .setStyle(ButtonStyle.Success);

    let treasureEmbed = new EmbedBuilder()
        .setTitle(`CLICK COLLECT TO GET ${points}PP`)
        .setImage("https://media1.tenor.com/m/BxOD5xq4VfIAAAAC/lebron-sunshine-lebron-james-sunshine.gif")
        .setColor("#FF0000");
        
    let actionRow = new ActionRowBuilder()
        .addComponents(treasureCollectButton);

    console.log(`Sent a Treasure event for ${points}PP`);
    bot.channels.cache.get("1239742831518679145").send({
        embeds: [treasureEmbed],
        components:[actionRow]
    }).then(message => setTimeout(async () => {
        // 404 error if the message has been deleted. Just catch it so it doesn't fail the bot
        console.log("Removing treasure event");
        message.delete().catch(error => {
            console.log(`Treasure all been collected`);
        });
    }, 10000))  
}

export default createEmbed;