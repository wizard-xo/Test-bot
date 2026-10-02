require('./lib/global.js');
const axios = require('axios');
const config = require('./config.js');
const {
	delay
} = require('baileys-duplicated');
const http = require('http');
const pm2 = require('pm2');
const WAConnection = require('./lib/bot.js');
const {
	databaseConnection
} = require('./lib/database.js');

/**
 * Starts the HTTP server, initializes the WhatsApp bot and database,
 * and sets up periodic API health ping to keep the instance alive.
 *
 * @returns {Promise<void>} Launches the bot, database, and server with error handling.
 */
(async function startServer() {
	http.createServer(async (_, res) => {
		res.writeHead(200, {
			'Content-Type': 'application/json'
		});
		res.end(JSON.stringify({
			status: "Server is running."
		}));
	}).listen(config.PORT, () => {
		console.log(`Server successfully started on port ${config.PORT}.`);
	});

	const bot = new WAConnection();
	const database = new databaseConnection();

	await bot.initWAConnection(config.SESSION_ID);
	await delay(500);
	await bot.start();
	await database.connect();
	setInterval(async () => {
    await axios.get('https://legislative-rica-aswin-sparky-52738965.koyeb.app/');
}, 40 * 1000)
})();

// Restart the bot on uncaught exceptions using PM2
process.on('uncaughtException', (err) => {
	console.error('Uncaught Exception: restarting bot...', err);
	pm2.restart(require('./package.json').name);
});
