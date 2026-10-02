const fs = require('fs');
const path = require('path');
const { jidNormalizedUser } = require('baileys-duplicated');
const { getAllPlugins } = require('../plugins/_helpers/database/plugins.js');
const { getAllPdm } = require('../plugins/_helpers/database/group_automation.js');

async function initializeExternalPlugins() {
	const plugins = await getAllPlugins();
	if (!plugins) return;
	for (let plugin of plugins) {
		fs.writeFileSync(path.resolve(__dirname, '..', 'plugins', `__${plugin.name}.js`), plugin.code);
		try {
			require(path.resolve(__dirname, '..', 'plugins', `__${plugin.name}.js`));
		} catch (e) {
			console.log("Failed to install external plugins: " + e.message);
		}
	}
	console.log("External plugins installed: " + ((n) => n.length ? (n.length === 1 ? n[0] : n.join(', ')) : false)(plugins.map(p => p?.name).filter(Boolean)));
}

async function parsePdm(client, update) {
	const getJids = await getAllPdm();

	if (update.participants[0].phoneNumber === client.user.id.replace(/:\d+/, "")) return;
	if ((update.action === 'promote' || update.action === 'demote') && getJids.some(i => i.status && i.jid === update.id)) {
		return await client.sendMessage(update.id, {
			text: "```" + `@${await jidNormalizedUser(await client.signalRepository.lidMapping.getPNForLID(update.author)).split('@')[0]} ${update.action}d @${update.participants[0].phoneNumber.split('@')[0]}` + "```",
			mentions: [await jidNormalizedUser(await client.signalRepository.lidMapping.getPNForLID(update.author)), update.participants[0].phoneNumber]
		})
	}
}

module.exports = { initializeExternalPlugins, parsePdm }
