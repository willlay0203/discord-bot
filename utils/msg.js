import {bot} from "../app.js"
const CHANNEL_ID = "1239383694033158254";
const TEST_CHANNEL_ID = "287132889483706369";
const DEFAULT_CHANNEL_ID = "1239383694033158254";

/**
 * Use to send a simple string a channel,  default bot channel - social-credit-updates
 */
export const msgChannel = (message, channelId = TEST_CHANNEL_ID) => {
    const channel = bot.channels.cache.get(channelId);
    channel.send(message);
}

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

export {createBetModal}
