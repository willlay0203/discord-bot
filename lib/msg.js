import {bot} from "../app.js"
const CHANNEL_ID = "1239383694033158254";
const TEST_CHANNEL_ID = "287132889483706369";

/**
 * Use to send a simple string to the default bot channel - social-credit-updates
 */
export const msgDefaultChannel = (message) => {
    const channel = bot.channels.cache.get(CHANNEL_ID);
    channel.send(message);
}

/**
 * Send a string to test channel
 */
export const msgTestChannel = (message) => {
    const channel = bot.channels.cache.get(TEST_CHANNEL_ID);
    channel.send(message);
}