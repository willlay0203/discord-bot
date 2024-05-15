import {bot} from "../app.js";

const DEFAULT_CHANNEL_ID = "1239383694033158254";

/**
 * Use to send a simple string a channel,  default bot channel - social-credit-updates
 */
export const msgChannel = (message, channelId = DEFAULT_CHANNEL_ID) => {
    const channel = bot.channels.cache.get(channelId);
    channel.send(message);
}