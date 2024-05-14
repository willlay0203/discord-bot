import {bot} from "../app.js";

const DEFAULT_CHANNEL_ID = "1239383694033158254";

/**
 * Use to send a simple string to the default bot channel - social-credit-updates
 */
export const msgDefaultChannel = (message) => {
    const channel = bot.channels.cache.get(DEFAULT_CHANNEL_ID);
    channel.send(message);
}