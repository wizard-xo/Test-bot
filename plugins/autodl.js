const autodlPlugins = require('../lib/plugins.js');
const {getAutodl, setAutodl, delAutodl, getAllAutodl} = require('./_helpers/database/autodl.js');
const {includesAnyUrls, extractUrlsFromText, extractInstagramUrls, isInstagramStoryUrl} = require('./_helpers/tools.js');
const {getJson} = require('./_helpers/request.js');

autodlPlugins.addPlugin({
	pattern: 'autodl',
	desc: 'All social media automatic downloader.',
	fromMe: true,
	category: 'downloader'
}, async ({
	match,
	message
}) => {
	const status = await getAutodl(message.jid);
	switch (match.toLowerCase()) {
		case 'on': {
			if (!status) {
				const data = await setAutodl(message.jid, true);
				if (!data) return;
				return await message.sendMessage(message.jid, "```Auto downloader has been enabled successfully.```")
			}
			if (status.status) return await message.sendMessage(message.jid, "```Auto downloader is already enabled.```");
			const data = await setAutodl(message.jid, true);
			if (!data) return;
			return await message.sendMessage(message.jid, "```Auto downloader has been enabled successfully.```");
		}
		break;
		case 'off': {
			if (!status) {
				const data = await setAutodl(message.jid, false);
				if (!data) return;
				return await message.sendMessage(message.jid, "```Auto downloader has been disabled successfully.```")
			}
			if (!status.status) return await message.sendMessage(message.jid, "```Auto downloader is already disabled.```");
			const data = await setAutodl(message.jid, false);
			if (!data) return;
			return await message.sendMessage(message.jid, "```Auto downloader has been disabled successfully.```")
		}
		break;
		case 'delete': {
			if (!status) return;
			const data = await delAutodl(message.jid);
			if (!data) return;
			return await message.sendMessage(message.jid, "```Auto downloader has been deleted successfully.```");
		}
		break;
	}
	return await message.sendMessage(message.jid, status ? "```" + `Auto Downloader Status\n\nStatus: ${status.status ? 'ON' : 'OFF'}` + "```" : "```Auto downloader is not enabled in this chat.```", {
		footer: 'Autodl Manager',
		buttons: status ? [{
				buttonId: message.prefix + 'autodl on',
				buttonText: {
					displayText: 'ON'
				},
				type: 1
			},
			{
				buttonId: message.prefix + 'autodl off',
				buttonText: {
					displayText: 'OFF'
				},
				type: 1
			},
			{
				buttonId: message.prefix + 'autodl delete',
				buttonText: {
					displayText: 'DELETE'
				},
				type: 1
			}
		] : [{
				buttonId: message.prefix + 'autodl on',
				buttonText: {
					displayText: 'ON'
				},
				type: 1
			},
			{
				buttonId: message.prefix + 'autodl off',
				buttonText: {
					displayText: 'OFF'
				},
				type: 1
			}
		],
		headerType: 1,
		viewOnce: true
	})
})

const facebookRegex = /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[^\s]+/
const tiktokRegex = /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/[^\s]+/

autodlPlugins.addPlugin({
		on: 'text',
		fromMe: false,
	    forcePublic: true
	},
	async ({
		message
	}) => {
		const chats = await getAllAutodl();
		if (chats?.some(chat => chat.jid === message.jid && chat.status)) {
			if (includesAnyUrls(message.text)) {
				const instagram = extractInstagramUrls(extractUrlsFromText(message.text))
				if (instagram.length) {
					for (const url of instagram) {
							const response = await getJson(API + '/v1/igdl?url=' + url);
							for (const media of response.response) {
								await message.sendMessage(message.jid, media.url, {
									caption: media.type === 'video' ? '```Instagram video```' : '```Instagram image```',
									quoted: message
								}, media.type);
							}
						}
					} else if (facebookRegex.test(message.text)) {
					const data = await getJson(`https://api-olive-five-53.vercel.app/fb?url=${message.text}`);
					const videoUrl = data?.data?.["720p (HD)"] || data?.data?.["360p (SD)"]
					if (!videoUrl) return
					return await message.sendMessage(message.jid, videoUrl, { mimetype: 'video/mp4', quoted: message }, 'video');
					} else {
					if (message.text === "https://www.tiktok.com/tiktoklite") return message.sendMessage(message.jid, "You tweaking twin, that's an app url", {}, 'reply');
					let bb = await getJson(`https://api-olive-five-53.vercel.app/tiktok?url=${message.text}`)
					if (!bb?.status || !bb?.downloadUrl) return
					return await message.sendMessage(message.jid, bb.downloadUrl, { mimetype: "video/mp4", caption: bb.mainText || "", quoted: message }, 'video')
					}
				}
			}
		}
)
