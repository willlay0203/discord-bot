import { bold, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { hasGameEnded, didWin} from '../commands/getMatch.js'
import { addPoints, removePoints, pointsEnough } from '../utils/points.js';
import { msgChannel } from '../utils/msg.js';

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
            }  
            // if (betOutcome === 'remake') {
            //     return 'remake';
            // }
            return false;
        }
        // Minute checks
        await new Promise(resolve => setTimeout(resolve, 60 * 1000));
    }
    console.log('Maximum checks reached');
    return false;
};

// create modal for gamble feature
export const createBetModal = () => {
    const betModal = new ModalBuilder()
        .setCustomId('betAmount')
        .setTitle('Bet Amount');
    
    const betAmountInput = new TextInputBuilder()
        .setCustomId('betAmountInput')
        .setLabel("How much do you want to bet?")
        .setStyle(TextInputStyle.Short);
    
    const firstActionRow = new ActionRowBuilder().addComponents(betAmountInput);
    betModal.addComponents(firstActionRow);

    return betModal;
}

// handle the bet interaction
// if the user's point count is enough place the bet
export const handleBet = async (interaction, match, userId, betAmount) => {
    let member = interaction.member;
    
    if (interaction.customId === 'win' || interaction.customId === 'loss') {
        const predictedResult = interaction.customId;
        await interaction.followUp(`**${member.user.displayName} placed a bet of ${betAmount} for a ${predictedResult}**`);
        removePoints(betAmount, member);
        const betResult = await checkBet(match, predictedResult, userId, member);
        if (betResult === true) {
            addPoints(betAmount * 2, member);
        }
        // if (betResult === 'remake') {
        //     console.log(`${member.user.displayName}'s bet was a remake. Refund ${betAmount} points.`);
        //     addPoints(betAmount, member);
        // }
        return betResult;
    }
};

// handle the modal
export async function handleBetModal(interaction, member, liveGameDetails) {
    const filter = i => i.customId === 'betAmount' && i.user.id === interaction.user.id;
    let betAmount = 0;

    try {
        betAmount = await new Promise((resolve, reject) => {
            const interactionHandler = async (modalInteraction) => {
                if (!filter(modalInteraction)) return;

                try {
                    betAmount = parseInt(modalInteraction.fields.getTextInputValue('betAmountInput'));
                    if (isNaN(betAmount) || betAmount <= 0) {
                        await modalInteraction.reply('Please enter a valid amount.');
                        reject('Invalid amount');
                    } else {
                        console.log(`${member.displayName} has bet ${betAmount} on match ${liveGameDetails.gameId}`);
                        await modalInteraction.reply({ content: 'Placing bet..', ephemeral: true });
                        resolve(betAmount);
                    }
                } catch (error) {
                    msgChannel('An error occured with the modal. Please try again');
                    reject(error);
                } finally {
                    interaction.client.off('interactionCreate', interactionHandler);
                }
            };

            interaction.client.on('interactionCreate', interactionHandler);

            setTimeout(() => {
                interaction.client.off('interactionCreate', interactionHandler);
                reject('Timeout waiting for interaction');
            }, 60000);
        });

        console.log(`Bet amount resolved: ${betAmount}`);
        return betAmount;
    } catch (error) {
        if (error === 'Timeout waiting for interaction') {
            console.log('No interaction received within the time limit.');
            return null;
        } else {
            console.error('Modal Error', error);
            return null;
        }
    }
}


export default {createBetModal, handleBet, handleBetModal};