import { bold } from 'discord.js';
import { hasGameEnded, didWin} from '../commands/getMatch.js'
import { addPoints, removePoints, pointsEnough } from '../utils/points.js';

// check bet status
// upon game end return true for successful bet, false for lost bet
const checkBet = async (match, predictedResult, userId) => {
    console.log(`Checking bet for match ${match}`);
    const gameOver = await hasGameEnded(match);

    // check every 3 minutes for the status of the game
    if (!gameOver) {
        setTimeout(() => checkBet(match, predictedResult, userId), 3 * 60 * 1000);
    }

    // game over
    if (gameOver) {
        console.log(`Game ${match} has ended.`);
        const betOutcome = await didWin(match, userId);
        console.log(`Bet outcome is ${betOutcome}`);
        console.log((`Predicted result is ${predictedResult}`));

        // if predicted result is also the outcome the bet is won
        if (betOutcome === predictedResult) {
            console.log('Bet win');
            addPoints('186803619209805825', 1000);
            return true;
        }

        console.log('Bet lost');
        return false;
    }
}

// handle the bet interaction
// if point count is enough place the bet
export const handleBet = async (interaction, match, userId) => {

    // if points aren't enough let user know
    const hasEnoughPoints = await pointsEnough(interaction.member.id, 10);

    if (!hasEnoughPoints) {
        console.log(`${interaction.member.id}'s points weren't enough for the bet`);
        await interaction.reply(`You don't have enough points to bet!`);
        return 0;
    }
    
    if (interaction.customId === 'win' || interaction.customId === 'loss') {
        const predictedResult = interaction.customId;
        removePoints('186803619209805825', 10);
        await interaction.reply(`You placed a bet for: ${predictedResult}`);
        checkBet(match, predictedResult, userId);
    }

};

export default handleBet;