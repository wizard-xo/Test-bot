const convertersPlugins = require('../lib/plugins.js');
const config = require('../config.js');
const { getFileDetails } = require('./_helpers/request.js');
const { upload, addAudioMetaData, quote } = require('./_helpers/converters.js')
const {
    mp4ToMp3,
    trimMp3
} = require('./_helpers/ffmpeg.js');

/**
 * Converts media messages (photo, video, or document) into a WhatsApp sticker.
 *
 * @param {string} match - Optional input for pack name and author, formatted as "packName,authorName"
 * @returns {Promise<void>} Sends the replied media message as a sticker.
 */
convertersPlugins.addPlugin({
	pattern: 'sticker',
	desc: 'Convert an image, video, or GIF into a whatsapp sticker.',
	fromMe: false,
	category: 'converter'
}, async ({
	match,
	message
}) => {
	if (!message.reply_message || !(message.reply_message.message.imageMessage || message.reply_message.message.videoMessage || message.reply_message.message.documentMessage)) return await message.sendMessage(message.jid, "```Reply to a photo/video/document.```", {}, 'reply');
	await message.sendMessage(message.jid, "⬆️", message.key, 'react');
	await message.sendMessage(message.jid, (await message.download()), {
		packName: match.split(',')[0] || config.STICKER_DATA.split(',')[0],
		authorName: match.split(',')[1] || config.STICKER_DATA.split(',')[1],
		quoted: message
	}, 'sticker');
	return await message.sendMessage(message.jid, "✅", message.key, 'react');
})

/**
 * Converts media messages (voice note, audios, video, or document videos) into a audio.
 *
 * @param {string} match - Optional input for cover image, title, artist and description, formatted as "coverimageurl,title,artist, description"
 * @returns {Promise<void>} Sends the replied media message as a audio.
 */
convertersPlugins.addPlugin({
	pattern: 'mp3',
	desc: 'Convert and download audio from a video or voice note in mp3 format.',
	fromMe: false,
	category: 'converter'
}, async ({
	match,
	message
}) => {
	if (!message.reply_message || !(message.reply_message.message.audioMessage || message.reply_message.message.videoMessage || message.reply_message.message.documentMessage && message.reply_message.message.documentMessage.mimetype.split('/')[0] === 'video' || message.reply_message.message.documentMessage && message.reply_message.message.documentMessage.mimetype.split('/')[0] === 'audio')) return await message.sendMessage(message.jid, "```Reply to a video/audio/video document.```", {}, 'reply');
	await message.sendMessage(message.jid, '⬆️', message.key, 'react');
    const buffer = await mp4ToMp3(await message.download(), {
        title: match.split(',')[0] || config.AUDIO_DATA.split(',')[0],
        artist: match.split(',')[1] || config.AUDIO_DATA.split(',')[1],
        album: match.split(',')[2] || config.AUDIO_DATA.split(',')[2],
        image: match.split(',')[3] || config.AUDIO_DATA.split(',')[3]
    });
	await message.sendMessage(message.jid, buffer, {
		mimetype: 'audio/mpeg',
		quoted: message
	}, 'audio');
	return await message.sendMessage(message.jid, '✅', message.key, 'react');
});

/**
 * Updates the metadata of a sticker or audio message.
 * 
 * For stickers: changes the pack name and author.  
 * For audio: sets metadata like cover image, title, artist, and description.
 *
 * @param {string} match - Comma-separated metadata values. 
 * For stickers: "packName,authorName".  
 * For audio: "coverImage,title,artist,description".
 *
 * @returns {Promise<void>} Edits and resends the replied media with new metadata.
 */
convertersPlugins.addPlugin({
	pattern: 'take',
	desc: "Change the sticker’s author and pack name, also supported for audio metadata.",
	fromMe: false,
	category: 'converter'
}, async ({
	match,
	message
}) => {
	if (!message.reply_message || !(message.reply_message.message.stickerMessage || message.reply_message.message.audioMessage)) return await message.sendMessage(message.jid, "```Reply to a sticker/audio.```", {}, 'reply');
	await message.sendMessage(message.jid, '⬆️', message.key, 'react');
	await message.sendMessage(message.jid, message.reply_message.message.stickerMessage ? (await message.download()) : (await addAudioMetaData((await toAudio((await message.download()))), {
		coverImage: match.split(',')[0] || config.AUDIO_DATA.split(',')[0],
		title: match.split(',')[1] || config.AUDIO_DATA.split(',')[1],
		artist: match.split(',')[2] || config.AUDIO_DATA.split(',')[2],
		description: match.split(',')[3] || config.AUDIO_DATA.split(',')[3]
	})), message.reply_message.message.stickerMessage ? {
		packName: match.split(',')[0] || config.STICKER_DATA.split(',')[0],
		authorName: match.split(',')[1] || config.STICKER_DATA.split(',')[1],
		quoted: message
	} : {
		mimetype: 'audio/mpeg',
		quoted: message
	}, message.reply_message.message.stickerMessage ? 'sticker' : 'audio')
	return await message.sendMessage(message.jid, '✅', message.key, 'react');
})

/**
 * Converts a replied audio message into WhatsApp voice note (ptt) format.
 * 
 * The audio is reprocessed and sent back with `ptt: true`, making it appear as a voice note.
 *
 * @returns {Promise<void>} Sends the audio as a voice note (push-to-talk format).
 */
convertersPlugins.addPlugin({
	pattern: 'vn',
	desc: 'Convert and send audio as a voice note (ptt) format in whatsapp.',
	fromMe: false,
	category: 'converter'
}, async ({
	message
}) => {
	if (!message.reply_message || !(message.reply_message.message.audioMessage)) return await message.sendMessage(message.jid, "```Reply to a audio.```", {}, 'reply');
	await message.sendMessage(message.jid, '⬆️', message.key, 'react');
	await message.sendMessage(message.jid, (await toAudio((await message.download()))), {
		mimetype: 'audio/mpeg',
		ptt: true,
		quoted: message
	}, 'audio');
	return await message.sendMessage(message.jid, '✅', message.key, 'react');
})

/**
 * Converts a sticker back into an image format.
 * 
 * Useful for extracting the original photo or content from a WhatsApp sticker.
 *
 * @returns {Promise<void>} Sends the sticker as an image message.
 */
convertersPlugins.addPlugin({
	pattern: 'photo',
	desc: 'Convert a sticker back into an image or extract the photo from a sticker.',
	fromMe: false,
	category: 'converter'
}, async ({
	message
}) => {
	if (!message.reply_message || !(message.reply_message.message.stickerMessage)) return await message.sendMessage(message.jid, "```Reply to a sticker.```", {}, 'reply');
	await message.sendMessage(message.jid, '⬆️', message.key, 'react');
	await message.sendMessage(message.jid, (await message.download()), {
		quoted: message
	}, 'image');
	return await message.sendMessage(message.jid, '✅', message.key, 'react');
})

/**
 * Generates a direct download or shareable URL from any media message.
 * 
 * Supports all media types including images, videos, stickers, audio, documents, PDFs, and other file formats.  
 * Useful for sharing or externally hosting any media content.
 *
 * @returns {Promise<void>} Sends the uploaded media URL as a text message.
 */
convertersPlugins.addPlugin({
		pattern: 'url',
		desc: 'Generate a direct download or shareable link from a media message.',
		fromMe: false,
		category: 'converter'
	},
	async ({
		message
	}) => {
		if (!message.reply_message || !(message.reply_message.message.imageMessage || message.reply_message.message.videoMessage || message.reply_message.message.stickerMessage || message.reply_message.message.audioMessage || message.reply_message.message.documentMessage)) {
			return await message.sendMessage(message.jid, "```Reply to a media message.```", {}, 'reply');
		}
		const edit = await message.sendMessage(message.jid, "```Please wait...```", {}, 'reply');
		return await message.sendMessage(message.jid, '```' + await upload(await message.download()) + '```', edit.key, 'edit')
	});

convertersPlugins.addPlugin({
    pattern: 'trim',
    desc: '',
    fromMe: false,
    category: 'converter'
},
   async({ match, message }) => {
    if (!message.reply_message || !(message.reply_message.message.audioMessage || message.reply_message.message.videoMessage || message.reply_message.message.documentMessage && message.reply_message.message.documentMessage.mimetype.split('/')[0] === 'video' || message.reply_message.message.documentMessage && message.reply_message.message.documentMessage.mimetype.split('/')[0] === 'audio')) return await message.sendMessage(message.jid, "```Reply to a video,audio,video or audio document.```", {}, 'reply');
    if(!match) return message.sendMessage(message.jid, "```Please give input.\nExample: " + message.prefix + "trim 30,1:05```", {}, 'reply');
    
    await message.sendMessage(message.jid, '🔁', message.key, 'react');
    if(message.reply_message.message.audioMessage || (message.reply_message.message.documentMessage && message.reply_message.message.documentMessage.mimetype.split('/')[0] === 'audio')) {
    const buffer = await trimMp3(await message.download(), match.split(",")[0], match.split(",")[1]);
    await message.sendMessage(message.jid, buffer, { mimetype: 'audio/mpeg', quoted: message }, 'audio');
    return await message.sendMessage(message.jid, '✅', message.key, 'react');
    }
});

convertersPlugins.addPlugin({
    pattern: 'q',
    desc: '',
    fromMe: false,
    category: 'converter'
},
   async({ match, client, message }) => {
	match = match || message.reply_message.text;
	if(!message.reply_message || !message.reply_message.text) return message.sendMessage(message.jid, "```Please reply to a message.```", {}, 'reply');
    
    await message.sendMessage(message.jid, '🔁', message.key, 'react');
	let pp;
	try {
		pp = await client.profilePictureUrl(message.reply_message ? message.reply_message.sender : message.sender, "image");
	} catch {
		pp = "https://telegra.ph/file/6880771a42bad09dd6087.jpg";
	}
	const buffer = await quote(pp, await client.getName(message.reply_message ? message.reply_message.sender : message.sender), match);
    await message.sendMessage(message.jid, buffer, {
		packName: config.STICKER_DATA.split(',')[0] || '',
		authorName: config.STICKER_DATA.split(',')[1] || 'KichuExe',
		quoted: message
	}, 'sticker');
    return await message.sendMessage(message.jid, '✅', message.key, 'react');
});
