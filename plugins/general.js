const generalPlugins = require('../lib/plugins.js');
const { plugins } = generalPlugins;
const { formatSize, uptime } = require('./_helpers/tools.js');
const os = require('os');

generalPlugins.addPlugin({
		pattern: 'help',
		desc: 'Display a list of available plugins.',
		fromMe: false,
		category: 'general'
	},
	async ({
		message
	}) => {
		const [day, date, time] = new Date().toLocaleString("en-IN", {
			weekday: 'long',
			year: 'numeric',
			month: 'numeric',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
			second: 'numeric',
			timeZone: "Asia/Kolkata"
		}).split(",")
		let text = `╭───────────────╮
    WhatsApp-Bot
╰───────────────╯
╭───────────────
│ Prefix : ${message.prefix === '' ? false : message.prefix}
│ User : ${message.senderName ? message.senderName : 'UnKnown!!'}
│ Time : ${time}
│ Day : ${day}
│ Date : ${date}
│ Version : ${require('../package.json').version}
│ Plugins : ${plugins.filter(plugin => !plugin.on).length}
│ Memory : ${formatSize(os.totalmem() - os.freemem())} / ${formatSize(os.totalmem())}
│ Uptime : ${uptime()}
│ Platform : ${PLATFORM}
╰───────────────

╭─────────────
`;

		let help = [],
			categories = new Set();

		plugins.forEach(plugin => {
			if (plugin.dontAddCommandList || !plugin.pattern) return;
			if (plugin.pattern) {
				pluginName = plugin.pattern.source.split('\\s*')[1].toString().match(/(\W*)([A-Za-züşiğ öç1234567890]*)/)[2];
			}
			if (!pluginName) return;
			help.push({
				name: pluginName
			});
		});
		help.forEach((plugin, i) => text += `│ ${i + 1}. ${plugin.name}\n`);
		text += `╰─────────────`
		return await message.sendMessage(message.jid, '```' + text + '```', {}, 'reply');
	}
);

generalPlugins.addPlugin({
		pattern: 'list',
		desc: 'List all active plugins available in the bot with description.',
		fromMe: false,
		category: 'general'
	},
	async ({
		message
	}) => {
		const list = [];
		let name;
		plugins.map(plugin => {
			if (plugin.dontAddCommandList || !plugin.pattern) return;
			if (plugin.pattern) {
				name = plugin.pattern.source.split('\\s*')[1].toString().match(/(\W*)([A-Za-züşiğ öç1234567890]*)/)[2];
			}
			list.push({
				name,
				desc: plugin.desc
			})
		});
		const text = list.map(plugin => `- *${plugin.name}*\n_${plugin.desc}_\n`).join('\n');
		return await message.sendMessage(message.jid, text, {}, 'reply');
	}
)

generalPlugins.addPlugin({
		pattern: 'menu',
		desc: 'Show the main menu with categorized bot plugins.',
		fromMe: false,
		category: 'general'
	},
	async ({
		match,
		message
	}) => {
		let text = `╭────────────────╮
│▢ User : ${message.senderName ? message.senderName : 'UnKnown!!'}
│▢ Plugins : ${plugins.filter(plugin => !plugin.on).length}
│▢ Uptime : ${uptime()}
│▢ Mode : ${require('../config.js').WORK_TYPE}
│▢ Platform : ${PLATFORM}
│▢ Memory : ${formatSize(os.totalmem() - os.freemem())} / ${formatSize(os.totalmem())}
│▢ Version : ${require('../package.json').version}
╰────────────────╯
`;
		let menuInfo = [],
			categories = new Set();

		plugins.forEach(plugin => {
			if (plugin.dontAddCommandList || !plugin.pattern) return;
			if (plugin.pattern) {
				pluginName = plugin.pattern.source.split('\\s*')[1].toString().match(/(\W*)([A-Za-züşiğ öç1234567890]*)/)[2];
			}
			if (!pluginName) return;

			let category = (plugin.category || 'misc').toLowerCase().trim();
			menuInfo.push({
				name: pluginName,
				category
			});
			categories.add(category);
		});

		categories = [...categories].sort();
		menuInfo.sort((a, b) => a.name.localeCompare(b.name));
		categories.forEach(category => {
			text += `
${category.toUpperCase()}
╭──────────────── \n`;
			menuInfo.filter(p => p.category === category)
				.forEach((plugin, i) => text += `│ ⬡ ${i + 1}. ${message.prefix}${plugin.name}\n`);
			text += "╰────────────────";
		});
		return await message.sendMessage(message.jid, "```" + text + "```", {}, 'reply');
	}
);
