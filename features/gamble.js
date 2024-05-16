import { bold } from 'discord.js';

export const handleBet = async (interaction, match) => {
    if (interaction.customId === 'win' || interaction.customId === 'loss') {
        const betResult = interaction.customId === 'win' ? 'Win' : 'Loss';
        await interaction.reply(`You placed a bet for: ${betResult}`);
    }
};

export default handleBet;