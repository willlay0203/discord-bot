import {EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder} from 'discord.js';
import { bot } from '../app.js';

export const createEmbed = () => {
    let points = Math.max(10 * (Math.floor(Math.random() * 20) + 2), 100);

    const treasureCollectButton = new ButtonBuilder()
        .setCustomId("treasureButton")
        .setLabel("COLLECT")
        .setStyle(ButtonStyle.Success);

    let treasureEmbed = new EmbedBuilder()
        .setTitle(`CLICK COLLECT FOR ${points}PP`)
        .setImage("https://media1.tenor.com/m/BxOD5xq4VfIAAAAC/lebron-sunshine-lebron-james-sunshine.gif")
        .setColor("#FF0000");
        
    let actionRow = new ActionRowBuilder()
        .addComponents(treasureCollectButton);

    bot.channels.cache.get("1239742831518679145").send({
        embeds: [treasureEmbed],
        components:[actionRow]
    }).then(message => setTimeout(async () => {
        // Fix the messages coming in wrong
        const messageId = await bot.channels.cache.get("1239742831518679145").messages.fetch(message.id);
        if (messageId === null) {
            console.log("cant find")
        } else {
            console.log("exists")
        }
    }, 10000
))
}

export default createEmbed;