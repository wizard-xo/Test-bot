const miscPlugins = require('../lib/plugins.js');
const {
	runtime,
	uptime
} = require('./_helpers/tools.js');
const {
	getJson
} = require('./_helpers/request.js');

/**
 * Measures the bot's response time (latency).
 *
 * @returns {Promise<void>} Sends a ping message, calculates latency, and edits the message with the result.
 */
miscPlugins.addPlugin({
		pattern: 'repo',
		desc: "Check the bot's repo",
		fromMe: false,
		category: 'misc'
	},
	async ({
		message
	}) => {
         const {
			key
        } =  await message.sendMessage(message.jid, "checking..", {}, 'reply');
		return await message.sendMessage(message.jid, "nokki iri ippo kittum! \n\n valla panikkum poda", key, 'edit');
	});

miscPlugins.addPlugin({
		pattern: 'ping',
		desc: "Check the bot's response time (latency).",
		fromMe: false,
		category: 'misc'
	},
	async ({
		message
	}) => {
		const start = new Date().getTime();
		const {
			key
		} = await message.sendMessage(message.jid, "```Ping!```", {}, 'reply');
		const end = new Date().getTime();
		return await message.sendMessage(message.jid, "```Pong!\n" + (end - start) + " ms```", key, 'edit');
	});

/**
 * Returns the JID of a mentioned user, replied message sender, or the current chat.
 *
 * @returns {Promise<void>} Sends back the detected JID in a reply.
 */
miscPlugins.addPlugin({
		pattern: 'jid',
		desc: "Returns the JID of a user or chat. It checks for a mentioned user, a reply message, or defaults to the current chat's JID.",
		fromMe: false,
		category: 'misc'
	},
	async ({
		message
	}) => {
		return await message.sendMessage(message.jid, message.reply_message ? message.reply_message.sender : message.jid, {}, 'reply')
	}
)

/**
 * Displays how long the bot has been running since startup.
 *
 * @returns {Promise<void>} Sends the formatted runtime duration in a reply.
 */
miscPlugins.addPlugin({
		pattern: 'runtime',
		desc: 'Display how long the bot has been running since it started.',
		fromMe: false,
		category: 'misc'
	},
	async ({
		message
	}) => {
		return await message.sendMessage(message.jid, "```Runtime: " + runtime() + "```", {}, 'reply')
	}
)

/**
 * Shows the bot's uptime in a human-readable format.
 *
 * @returns {Promise<void>} Sends the formatted uptime in a reply.
 */
miscPlugins.addPlugin({
		pattern: 'uptime',
		desc: "Show the bot's uptime in a human-readable format.",
		fromMe: false,
		category: 'misc'
	},
	async ({
		message
	}) => {
		return await message.sendMessage(message.jid, "```Uptime: " + uptime() + "```", {}, 'reply')
	}
)
