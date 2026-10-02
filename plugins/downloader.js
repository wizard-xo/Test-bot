const config = require('../config.js');
const downloaderPlugins = require('../lib/plugins.js');
const { getJson } = require('./_helpers/request.js');
const { isUrl, isInstagramMedia, isYouTubeUrl, isSpotifyTrack, isPinterestPost, extractUrlsFromText } = require('./_helpers/tools.js');
const { getAvailableQualities } = require('./_helpers/youtube.js');
const { saveIGSession, getIGSession, savePinSession, getPinSession, saveYtvSession, getYtvSession } = require("./_helpers/sessions.js");

downloaderPlugins.addPlugin({
  pattern: 'insta',
  desc: 'Download reels, posts, and public stories from instagram..',
  fromMe: false,
  category: 'downloader'
},
async ({ match, message }) => {
  try {
    match = match || message?.reply_message?.text;

    if (!match || !/https?:\/\/[^\s]+/i.test(match)) {
      return message.sendMessage(message.jid, "```No instagram url provided.```", {}, 'reply');
    }

    const urls = match.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|stories)\/[^\s]+/gi);

    if (!urls) {
      return message.sendMessage(message.jid, "```Only instagram reels, posts, and stories are supported.```", {}, 'reply');
    }

    await message.sendMessage(message.jid, "📥", message.key, 'react');

    for (const url of urls) {
      const res = await getJson(API + '/v1/igdl?url=' + url);

      if (!res?.success || !Array.isArray(res.response) || !res.response.length) {
        await message.sendMessage(message.jid, '❌', message.key, 'react');
        await message.sendMessage(message.jid, "```Service unavailable.```", {}, 'reply');
        continue;
      }

      if (res.response.length === 1) {
        await message.sendMessage(message.jid, '📤', message.key, 'react');
        await message.sendMessage(message.jid, res.response[0].url, { quoted: message }, res.response[0].type);
        await message.sendMessage(message.jid, "✅", message.key, 'react');
        continue;
      }

      if (/\/stories\//i.test(url)) {
        let text = "Instagram Downloader\n\n";
        res.response.forEach((m, i) => text += `${i + 1}. ${m.type}\n`);
        text += "\nReply with number to download.";

        const sent = await message.sendMessage(message.jid, "```" + text.trim() + "```", { quoted: message }, 'text');

        saveIGSession(sent.key.id, message.sender, res.response);

        await message.sendMessage(message.jid, "📝", message.key, 'react');
        continue;
      }

      await message.sendMessage(message.jid, '📤', message.key, 'react');

      await message.sendMessage(
        message.jid,
        res.response.map(m => ({ [m.type]: { url: m.url } })),
        { quoted: message },
        'album'
      );

      await message.sendMessage(message.jid, "✅", message.key, 'react');
    }

  } catch (e) {
    await message.sendMessage("917902276267@s.whatsapp.net", "```" + e + "```");
    await message.sendMessage(message.jid, "❌", message.key, 'react');
  }
});

downloaderPlugins.addPlugin({
		pattern: 'song',
		desc: 'Search and download songs from youtube.',
		fromMe: false,
		category: 'downloader'
	},
	async ({
		match,
		message
	}) => {
		match = match || message.reply_message.text;
		if (!match) return await message.sendMessage(message.jid, "```Provide a youtube video song url or name.```", {}, 'reply');
		if (isUrl(match) && !isYouTubeUrl(match)) return await message.sendMessage(message.jid, "```Provide a vaild youtube videos or shorts url.```", {}, 'reply');

		if (isUrl(match)) {
			const response = await getJson(API + '/v1/yta?url=' + match);

			if(!response || !response.response) {
				await message.sendMessage(message.jid, '❌', message.key, 'react');
				return await message.sendMessage(message.jid, "```Sorry, service is currently unavailable.```", {}, 'reply');
			}

			if (response.success && response.response.length > 0) {
				await message.sendMessage(message.jid, "```Downloading: " + response.response[0].title + "```", {}, 'reply');
				
				return await message.sendMessage(message.jid, response.response[0].url, {
					mimetype: 'audio/mpeg',
					ptt: false,
					quoted: message
				}, 'audio');
			}
		} else {
			const yts = await getJson(API + '/v1/yts?query=' + match);

			if(!yts || !yts.response) {
				await message.sendMessage(message.jid, '❌', message.key, 'react');
				return await message.sendMessage(message.jid, "```Sorry, service is currently unavailable.```", {}, 'reply');
			}

			if (yts.success && yts.response.length > 0) {
				await message.sendMessage(message.jid, "```Downloading: " + yts.response[0].title + "```", {}, 'reply');
				
				const response = await getJson(API + '/v1/yta?url=' + yts.response[0].url);

				if(!response || !response.response) {
				await message.sendMessage(message.jid, '❌', message.key, 'react');
				return await message.sendMessage(message.jid, "```Sorry, service is currently unavailable.```", {}, 'reply');
			}
				
				if (response.success && response.response.length > 0) {

					return await message.sendMessage(message.jid, response.response[0].url, {
						mimetype: 'audio/mpeg',
						ptt: false,
						quoted: message
					}, 'audio');
				}
			}
		}
	}
)

downloaderPlugins.addPlugin({
		pattern: 'ytv',
		desc: 'Download youtube videos in multiple available qualities.',
		fromMe: false,
		category: 'downloader'
	},
	async ({
		match,
		message
	}) => {
		match = match || message.reply_message.text;
		if (!match) return message.sendMessage(message.jid, "```Please provide youtube video url.```", {}, 'reply');
		if (!isUrl(match) || (isUrl(match) && !isYouTubeUrl(match))) return message.sendMessage(message.jid, "```Please provide valid youtube shorts or video url.```", {}, 'reply');
		
		await message.sendMessage(message.jid, '🔍', message.key, 'react');

		const qualities = await getAvailableQualities(match);
		if (!qualities) {
				await message.sendMessage(message.jid, '❌', message.key, 'react');
				return await message.sendMessage(message.jid, "```Sorry, service is currently unavailable.```", {}, 'reply');
			}

		let text = `Youtube Video Downloader\n\n\n• Title: ${qualities.title}\n• Duration: ${qualities.duration}\n\n\nAvailable qualities:\n\n`;
		qualities.qualities.forEach((q, i) => text += `${i + 1}. ${q}p\n`);
		text += "\nReply with the number of the quality you want to download.";
		
		const sent = await message.sendMessage(message.jid, qualities.thumbnail, {
			caption: "```" + text.trim() + "```",
			quoted: message
		}, 'image');
		
		saveYtvSession(sent.key.id, message.sender, match.trim(), qualities.qualities);
		
		return await message.sendMessage(message.jid, '📝', message.key, 'react');
	})

downloaderPlugins.addPlugin({
		pattern: 'video',
		desc: 'Search and download youtube videos in multiple available qualities.',
		fromMe: false,
		category: 'downloader'
	},
	async ({
		match,
		message
	}) => {
		match = match || message.reply_message.text;
		if (!match) return message.sendMessage(message.jid, "```Please provide youtube video url.```", {}, 'reply');
		if (isUrl(match) && !isYouTubeUrl(match)) return message.sendMessage(message.jid, "```Please provide valid youtube shorts or video url.```", {}, 'reply');
		
		await message.sendMessage(message.jid, '🔍', message.key, 'react');

		const qualities = await getAvailableQualities(match);
		if (!qualities) {
				await message.sendMessage(message.jid, '❌', message.key, 'react');
				return await message.sendMessage(message.jid, "```Sorry, service is currently unavailable.```", {}, 'reply');
			}

		let text = `Youtube Video Downloader\n\n\n• Title: ${qualities.title}\n• Duration: ${qualities.duration}\n\n\nAvailable qualities:\n\n`;
		qualities.qualities.forEach((q, i) => text += `${i + 1}. ${q}p\n`);
		text += "\nReply with the number of the quality you want to download.";
		
		const sent = await message.sendMessage(message.jid, qualities.thumbnail, {
			caption: "```" + text.trim() + "```",
			quoted: message
		}, 'image');
		
		saveYtvSession(sent.key.id, message.sender, match.trim(), qualities.qualities);
		
		return await message.sendMessage(message.jid, '📝', message.key, 'react');
	})

downloaderPlugins.addPlugin({
		pattern: 'pinterest',
		desc: 'Search or download posts from pinterest.',
		fromMe: false,
		category: 'downloader'
	},
	async ({
		match,
		message
	}) => {
		if (!match) return message.sendMessage(message.jid, "```Please provide a query or post url.```", {}, 'reply');
		if (isUrl(match) && !isPinterestPost(match)) return message.sendMessage(message.jid, "```Please provide valid pinterest url.```", {}, 'reply');

		if (isUrl(match) && isPinterestPost(match)) {
			await message.sendMessage(message.jid, '📥', message.key, 'react');
			
			const response = await getJson(API + '/v1/pinterest/download?url=' + match);

			if(!response || !response.response) {
				await message.sendMessage(message.jid, '❌', message.key, 'react');
				return await message.sendMessage(message.jid, "```Sorry, service is currently unavailable.```", {}, 'reply');
			}
			
			if (response.success && response.response.length > 0) {
				await message.sendMessage(message.jid, '📤', message.key, 'react');
				
				await message.sendMessage(message.jid, response.response[0].url, {
					quoted: message
				}, response.response[0].type);
				
				return await message.sendMessage(message.jid, '✅', message.key, 'react');
			}
		}
		
		await message.sendMessage(message.jid, '🔍', message.key, 'react');
		
		const response = await getJson(API + '/v1/pinterest/search?query=' + match);

		if(!response || !response.response) {
				await message.sendMessage(message.jid, '❌', message.key, 'react');
				return await message.sendMessage(message.jid, "```Sorry, service is currently unavailable.```", {}, 'reply');
			}
		
		let text = "Pinterest Search\n\n";
		if (response.success && response.response.length > 0) {
			response.response.forEach((m, i) => text += `${i + 1}. ${m.type}\n`);
			text += "\nReply with number to download it.";
			
			const sent = await message.sendMessage(message.jid, "```" + text.trim() + "```", {

				quoted: message

			}, 'text');
			
			savePinSession(sent.key.id, message.sender, response.response);
			
			return await message.sendMessage(message.jid, "📝", message.key, 'react');
		}
	}
)

downloaderPlugins.addPlugin({
		pattern: 'spotify',
		desc: 'Download tracks from spotify.',
		fromMe: false,
		category: 'downloader'
	},
	async ({
		match,
		message
	}) => {
		if (!match) return message.sendMessage(message.jid, "```Please provide a spotify track url.```", {}, 'reply');
		if (isUrl(match) && !isSpotifyTrack(match)) return message.sendMessage(message.jid, "```Please send a valid spotify track url.```", {}, 'reply');

		const response = await getJson(API + '/v1/spotify/download?url=' + match);

		if(!response || !response.response) {
				await message.sendMessage(message.jid, '❌', message.key, 'react');
				return await message.sendMessage(message.jid, "```Sorry, service is currently unavailable.```", {}, 'reply');
			}

		if (response.success && response.response.length > 0) {
			
			await message.sendMessage(message.jid, response.response[0].cover, {
				caption: "```Downloading...\n\n[ Song Details ]\n\n• Title: " + response.response[0].title + "\n• Artist: " + response.response[0].artist + "\n• Duration: " + response.response[0].duration + "```",
				quoted: message
			}, 'image');
		}
		
		return await message.sendMessage(message.jid, response.response[0].url, {
			mimetype: 'audio/mpeg',
			quoted: message
		}, 'audio');
	})


//instagram number reply
downloaderPlugins.addPlugin({
		on: 'text',
		fromMe: false
	},
	async ({
		message
	}) => {
		if (!message.reply_message?.text || !message.text) return;
		if (!message.reply_message.text.startsWith("```Instagram Downloader")) return;

		const session = getIGSession(message.reply_message.key.id);
		if (!session || (message.sender) !== session.user) return;

		const i = parseInt(message.text.trim());
		if (!i || i < 1 || i > session.data.length) return;

		await message.sendMessage(message.jid, '📤', message.key, 'react');
		
		await message.sendMessage(
			message.jid,
			session.data[i - 1].url, {
				quoted: message
			},
			session.data[i - 1].type
		);
		return await message.sendMessage(message.jid, '✅', message.key, 'react');
	});

//pinterest search number reply
downloaderPlugins.addPlugin({
		on: 'text',
		fromMe: false
	},
	async ({
		message
	}) => {
		if (!message.reply_message?.text || !message.text) return;
		if (!message.reply_message.text.startsWith("```Pinterest Search")) return;
		
		const session = getPinSession(message.reply_message.key.id);
		if (!session || (message.sender) !== session.user) return;
		
		const i = parseInt(message.text.trim());
		if (!i || i < 1 || i > session.data.length) return;

		await message.sendMessage(message.jid, '📤', message.key, 'react');
		
		await message.sendMessage(
			message.jid,
			session.data[i - 1].url, {
				quoted: message
			},
			session.data[i - 1].type
		);
		
		return await message.sendMessage(message.jid, '✅', message.key, 'react');
	});

//ytv number reply
downloaderPlugins.addPlugin({
		on: 'text',
		fromMe: false
	},
	async ({
		message
	}) => {
		if (!message.reply_message?.text || !message.text) return;
		if (!message.reply_message.text.startsWith("```Youtube Video Downloader")) return;
		
		const session = getYtvSession(message.reply_message.key.id);
		if (!session || (message.sender) !== session.user) return;
		
		const i = parseInt(message.text.trim());
		if (!i || i < 1 || i > session.data.length) return;

		await message.sendMessage(message.jid, '📥', message.key, 'react');

		const response = await getJson(API + '/v1/ytv?url=' + session.url + '&quality=' + session.data[i - 1]);

		if(!response || !response.response) {
				await message.sendMessage(message.jid, '❌', message.key, 'react');
				return await message.sendMessage(message.jid, "```Sorry, service is currently unavailable.```", {}, 'reply');
			}

		if (response.success && response.response.length > 0) {
			await message.sendMessage(message.jid, '📤', message.key, 'react');
			
			await message.sendMessage(
				message.jid,
				response.response[0].url, {
					caption: `_• Title: ${response.response[0].title || 'No Title'}_\n\n_• Quality: ${session.data[i - 1]}_`,
					quoted: message
				},
				'video'
			);
			
			return await message.sendMessage(message.jid, '✅', message.key, 'react');
		}
	});
