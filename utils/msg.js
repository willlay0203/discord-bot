import {bot} from "../app.js"
import { Client, Events, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, transformResolved, bold, ModalBuilder, TextInputBuilder, TextInputStyle} from 'discord.js';
const CHANNEL_ID = "1239383694033158254";
const TEST_CHANNEL_ID = "287132889483706369";
const DEFAULT_CHANNEL_ID = "1239383694033158254";

/**
 * Use to send a simple string a channel,  default bot channel - social-credit-updates
 */
export const msgChannel = (message, channelId = DEFAULT_CHANNEL_ID) => {
    const channel = bot.channels.cache.get(channelId);
    channel.send(message);
}
