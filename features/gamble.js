import { bold } from 'discord.js';
import { hasGameEnded, didWin} from '../commands/getMatch.js'

// check bet status
const checkBet = async (match, predictedResult, userId) => {
    console.log(`Checking bet for match ${match}`);
    const gameOver = await hasGameEnded(match);

    // check every 3 minutes for the status of the game
    if (!gameOver) {
        setTimeout(() => checkBet(match, predictedResult, userId), 3 * 60 * 1000);
    }

    if (gameOver) {
        console.log(`Game ${match} has ended.`);
        const betOutcome = didWin(match, userId);
        console.log(`Bet outcome is ${betOutcome}`);
        console.predictedResult(`Predicted result is ${predictedResult}`);

        if (betOutcome === predictedResult) {
            console.log('Bet win');
            removeTenPoints('186803619209805825');
            return;
        }
        console.log('Bet lost');
    }
}

// handle the bet interaction
export const handleBet = async (interaction, match, userId) => {
    if (interaction.customId === 'win' || interaction.customId === 'loss') {
        const predictedResult = interaction.customId;
        await interaction.reply(`You placed a bet for: ${predictedResult}`);
        checkBet(match, predictedResult, userId);
    }

};

export default handleBet;