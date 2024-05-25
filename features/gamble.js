import { bold } from 'discord.js';
import { hasGameEnded, didWin} from '../commands/getMatch.js'
import { addPoints, removePoints, pointsEnough } from '../utils/points.js';

// check bet status
// upon game end return true for successful bet, false for lost bet
const checkBet = async (match, predictedResult, userId, member) => {
    const maxChecks = 30;
    console.log(`Checking bet for match ${match}`);
    
    for (let checkCount = 0; checkCount < maxChecks; checkCount++) {
        const gameOver = await hasGameEnded(match);
        if (gameOver) {
            console.log(`Game ${match} has ended.`);
            const betOutcome = await didWin(match, userId);
            console.log(`Bet outcome is ${betOutcome}`);
            console.log(`Predicted result was ${predictedResult}`);

            if (betOutcome === predictedResult) {
                return true;
            } else {
                return false;
            }
        }
        // 3 minute checks
        await new Promise(resolve => setTimeout(resolve, 3 * 60 * 1000));
    }
    console.log('Maximum checks reached');
    return false;
};

// handle the bet interaction
// if the user's point count is enough place the bet
export const handleBet = async (interaction, match, userId, betAmount) => {
    let member = interaction.member;
    const hasEnoughPoints = await pointsEnough(interaction.member.id, betAmount);

    if (!hasEnoughPoints) {
        console.log(`${interaction.member.id}'s points weren't enough to the bet`);
        await interaction.followUp(`You dont have enough points for this bet!`);
        return false;
    }
    
    if (interaction.customId === 'win' || interaction.customId === 'loss') {
        const predictedResult = interaction.customId;
        await interaction.followUp(`**${member.user.displayName} placed a bet of ${betAmount} for a ${predictedResult}**`);
        removePoints(betAmount, member);
        const betResult = await checkBet(match, predictedResult, userId, member);
        if (betResult) {
            addPoints(betAmount * 2, member);
        }
        return betResult;
    }
};

export default handleBet;