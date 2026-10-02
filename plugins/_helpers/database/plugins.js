const {initSequelize} = require('../../../lib/database.js');
const {DataTypes} = require('sequelize');
const {isUrl} = require('../tools.js');
const axios = require('axios').default;

const pluginsDatabase = initSequelize.define('plugins', {
	name: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true
	},
	url: {
		type: DataTypes.STRING,
		allowNull: false
	},
	code: {
		type: DataTypes.TEXT,
		allowNull: false
	}
}, {
	tableName: 'plugins'
});

(async () => {
	await pluginsDatabase.sync({
		alter: true
	});
})();

async function findPlugin(name) {
	const response = await pluginsDatabase.findOne({
		where: {
			name
		}
	});
	return response ? true : false;
}

async function installPlugin(url) {
	const results = [];
	const alreadyExists = [];

	if (!isUrl(url)) return {
		installed: results,
		skipped: alreadyExists
	};

	const {
		status,
		data
	} = await axios.get(url);
	if (status !== 200 || !data) return {
		installed: results,
		skipped: alreadyExists
	};

	const variables = data.match(/^([\s\S]*?)(?:\b\w+\s*\.\s*)?addPlugin\s*\(/);
	const regex = /(?:\b(\w+)\s*\.\s*)?addPlugin\s*\(\s*({[^]*?})\s*,\s*(async\s*\([^)]*\)\s*=>\s*{[^]*?})\s*\)/g;

	let match;
	while ((match = regex.exec(data)) !== null) {
		const objectName = match[1] || '';
		const options = match[2];
		const handler = match[3];

		const nameMatch = options.match(/pattern\s*:\s*['"`](.*?)['"`]/);
		const name = nameMatch ? nameMatch[1] : 'unknown';

		const isExistingPlugin = await findPlugin(name);

		if (!isExistingPlugin) {
			const code = `${variables ? variables[1].trim() : ''}\n\n${objectName ? `${objectName}.` : ''}addPlugin(${options}, ${handler});`;

			await pluginsDatabase.create({
				name,
				url,
				code
			});
			results.push({
				name,
				url,
				code
			});
		} else {
			alreadyExists.push(name);
		}
	}

	return {
		installed: results,
		skipped: alreadyExists
	};
}


async function removePlugin(name) {
		const data = await findPlugin(name);
		if (!data) return false;
		const response = await pluginsDatabase.findOne({
			where: {
				name
			}
		})
		await response.destroy();
		return true;
}

async function getAllPlugins() {
	const result = [];
	const response = await pluginsDatabase.findAll();
	response.map((e) => {
		result.push({
			name: e.name,
			url: e.url,
			code: e.code
		})
	})
	return result.length > 0 ? result : false;
}

module.exports = {
	findPlugin,
	installPlugin,
	removePlugin,
	getAllPlugins
}
