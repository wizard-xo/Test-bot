const plugins = require('../lib/plugins.js');
const fs = require('fs');
const {findPlugin, installPlugin, removePlugin, getAllPlugins} = require('./_helpers/database/plugins.js');
const {includesAnyUrls, extractUrlsFromText, normalizeGistUrls} = require('./_helpers/tools.js');

plugins.addPlugin({
		pattern: 'install',
		desc: 'Installs external plugins.',
		fromMe: true,
		category: 'user'
	},
	async ({
		match,
		message
	}) => {
		match = match || message.reply_message.text;
		if (!includesAnyUrls(match)) return await message.sendMessage(message.jid, "```Please provide valid external plugin url.```", {}, 'reply');

		const urls = normalizeGistUrls(extractUrlsFromText(match));
		if (urls.length <= 0) return await message.sendMessage(message.jid, "```Invalid external plugin url.```", {}, 'reply');

		let installed = [];
		let skipped = [];

		for (let url of urls) {
			const response = await installPlugin(url);
			for (let plugin of response.installed) {
				fs.writeFileSync(__dirname + "/__" + plugin.name + ".js", plugin.code);
				try {
					require(`./__${plugin.name}.js`);
				} catch (e) {
					fs.unlinkSync(__dirname + "/__" + plugin.name + ".js");
					return await message.sendMessage(
						message.jid,
						"```Invalid plugin\n" + e.message + "```"
					);
				}
			}

			installed.push(...response.installed.map(p => p.name));
			skipped.push(...response.skipped);
		}

		const msgParts = [];
		if (installed.length) msgParts.push(`New plugin${installed.length > 1 ? 's' : ''} installed: ${installed.join(', ')}`);
		if (skipped.length) msgParts.push(`Plugin${skipped.length > 1 ? 's ' : ''} already exists: ${skipped.join(', ')}`);

		return await message.sendMessage(
			message.jid,
			"```" + (msgParts.length ? msgParts.join('\n') : "No plugins have been installed.") + "```", {},
			'reply'
		);
	}
);


plugins.addPlugin(
  {
    pattern: 'remove',
    desc: 'Remove external plugins.',
    fromMe: true,
    category: 'user'
  }, async ({match, message}) => {
    if(!match) return await message.sendMessage(message.jid, "```Enter the plugin name to remove, or use 'all' to remove all plugins.```", {}, 'reply');
	  const pluginNames = match.trim().toLowerCase() === 'all' ? await getAllPlugins() : await findPlugin(match) ? [{ name: match }] : false;
	  if(!pluginNames || !pluginNames.length) return await message.sendMessage(message.jid, match.trim().toLowerCase() === 'all' ? "_No plugins found to remove._" : `_Plugin ${match} not found._`, {}, 'reply');
	  for(let plugin of pluginNames) {
		  try {
			  delete require.cache[require.resolve("./__" + plugin.name + ".js")];
			  fs.unlinkSync(__dirname + "/__" + plugin.name + ".js");
			  await removePlugin(plugin.name);
		  } catch (err) {
			  console.error("Failed to remove plugin " + plugin.name + ":" , err.message);
		  }
	  }
	  await message.sendMessage(message.jid, pluginNames.length ? "```" + `Plugin${pluginNames.length > 1 ? 's' : ''} removed: ${pluginNames.map(e => e.name).join(', ')}` + "\n\nRebooting...```" : "```No plugins were removed.```", {}, 'reply');
	  return require('pm2').restart(require('../package.json').name);
  }
  )


plugins.addPlugin(
  {
    pattern: 'plugin',
    desc: '',
    fromMe: true,
    category: 'user'
  }, async ({match, message}) => {
	  const pluginsList = await getAllPlugins();
	  if(!pluginsList) return await message.sendMessage(message.jid, "```No external plugins installed.```", {}, 'reply');
	  if(match) {
		  const matched = pluginsList.find(list => list.name === match.trim().toLowerCase())
		  if(!matched) return await message.sendMessage(message.jid, "```Plugin " + match.trim().toLowerCase() + " is not installed.```", {}, 'reply');
		  return await message.sendMessage(message.jid, "```" + `${matched.name}\n${matched.url}` + "```", {}, 'reply')
	  }
	  let grouped = {};
	  for (let p of pluginsList) {
		  grouped[p.url] = grouped[p.url] ? [...grouped[p.url], p.name] : [p.name];
	  }
	  let output = '```';
	  for (let [url, names] of Object.entries(grouped)) {
		  output += `${names.join(', ')}\n${url}\n\n`;
	  }
	  output += '```';
	  return await message.sendMessage(message.jid, output, {}, 'reply');
  }
)
