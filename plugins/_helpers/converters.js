const { request,fetch } = require('undici');
const FormData = require('form-data');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const ID3Writer = require('browser-id3-writer');
const os = require('os');
const path = require('path');
const webp = require('node-webpmux')
const { isUrl } = require('./tools.js');
const { getBuffer, getFileDetails } = require('./request.js');

async function upload(buffer) {
	try {

		try {
			const form = new FormData();
			const file = await getFileDetails(buffer);
			form.append('file', file.data, {
				filename: file.filename,
				contentType: file.mime
			});
			form.append('fileName', file.filename);

			const res = await request('https://cdn.morphlix.in/upload', {
				method: 'POST',
				headers: form.getHeaders(),
				body: form
			});

			const data = await res.body.json();
			if (data?.url) return data.url;
		} catch {}

		try {
			const res = await request(API + '/v1/upload', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/octet-stream'
				},
				body: buffer
			});

			const data = await res.body.json();
			if (data?.url) return data.url;
		} catch {}

		try {
			const form = new FormData();
			const file = await getFileDetails(buffer);
			form.append('file', file.data, {
				filename: file.filename,
				contentType: file.mime
			});
			form.append('fileName', file.filename);

			const res = await request('https://cdn.lordx.dpdns.org/upload', {
				method: 'POST',
				headers: form.getHeaders(),
				body: form
			});

			const data = await res.body.json();
			if (data?.stream_url) return data.stream_url;
		} catch {}

		try {
			const form = new FormData();
			const file = await getFileDetails(buffer);
			form.append('file', file.data, {
				filename: file.filename,
				contentType: file.mime
			});
			form.append('fileName', file.filename);

			const res = await request('https://lordxddcdn.onrender.com/upload', {
				method: 'POST',
				headers: form.getHeaders(),
				body: form
			});

			const data = await res.body.json();
			if (data?.dlink) return data.dlink;
		} catch {}

		try {
			const userAgents = [
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
				'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_2 like Mac OS X)',
				'Mozilla/4.0 (compatible; MSIE 9.0; Windows NT 6.1)',
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/87.0',
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/18.18363'
			];

			const form = new FormData();
			const file = await getFileDetails(buffer);
			form.append('fileToUpload', file.data, file.filename);
			form.append('reqtype', 'fileupload');

			const res = await request('https://catbox.moe/user/api.php', {
				method: 'POST',
				headers: {
					...form.getHeaders(),
					'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)]
				},
				body: form
			});

			const url = await res.body.text();
			if (url.startsWith('http')) return url;
		} catch {}

		try {
			const form = new FormData();
			const file = await getFileDetails(buffer);
			form.append('file', file.data, {
				filename: file.filename,
				contentType: file.mime
			});
			form.append('fileName', file.filename);

			const res = await request('https://upload.imagekit.io/api/v1/files/upload', {
				method: 'POST',
				headers: {
					...form.getHeaders(),
					Authorization: 'Basic ' + Buffer.from('private_Tm5wVjyqRy4/KE2ePaKk01fDoRI=' + ':').toString('base64')
				},
				body: form
			});

			const data = await res.body.json();
			if (data?.url) return data.url;
		} catch {}

		return 'Service unavailable.';
	} catch {
		return 'Service unavailable.';
	}
}

        
async function createTmpFile(fileBuffer, extension) {
	const dir = os.tmpdir();
	const tmpFilePath = path.join(dir, `tempfile-${Date.now()}.${extension}`);
	await fs.writeFileSync(tmpFilePath, fileBuffer);
	return tmpFilePath;
}

async function createFile(extension) {
	const dir = os.tmpdir();
	const tmpFileName = `tempfile-${Date.now()}.${extension}`;
	const tmpFilePath = path.join(dir, tmpFileName);
	return tmpFilePath;
}

async function toAudio(buffer) {
  const inputFilePath = await createTmpFile(buffer, 'mp4');
  const outputFilePath = await createFile('mp3');

  await new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .outputOptions(['-vn', '-ac', '2', '-b:a', '128k', '-ar', '44100', '-f', 'mp3'])
      .on('error', reject)
      .on('end', resolve)
      .save(outputFilePath);
  });

  const outputBuffer = fs.readFileSync(outputFilePath);
  fs.unlinkSync(inputFilePath);
  fs.unlinkSync(outputFilePath);

  return outputBuffer;
}

async function addAudioMetaData(buffer, options = {}) {
	buffer = Buffer.isBuffer(buffer) ? buffer : isUrl(buffer) ? await getBuffer(buffer) : null;
	const writer = new ID3Writer(buffer);
	writer.setFrame("TIT2", options.title || 'Whatsapp-Bot')
	.setFrame('TPE1', [`${options.artist || 'KichuExe'}`])
	.setFrame('TALB', ' ')
	.setFrame('TYER', 2004)
	.setFrame("APIC", {
		type: 3,
		data: Buffer.isBuffer(options.coverImage) ? options.coverImage : isUrl(options.coverImage) ? (await getBuffer(options.coverImage)) : (await getBuffer("https://avatars.githubusercontent.com/u/99080094?s=500&v=4")),
		description: options.description || 'A multifunctional whatsapp bot by KichuExe.'
	})
	writer.addTag();
	return Buffer.from(writer.arrayBuffer);
}

async function addStickerMetaData(stickerBuffer, options) {
	const img = new webp.Image();
	const { packName, authorName, categories } = options;
	const stickerPackId = [...Array(32)].map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
	const json = {
		'sticker-pack-id': stickerPackId,
		'sticker-pack-name': (options.packName || ''),
		'sticker-pack-publisher': (options.authorName || ''),
		'emojis': (options.categories || ['💖']),
		'android-app-store-link': 'https://github.com/KichuExe/Whatsapp-Bot',
		'ios-app-store-link': 'https://github.com/KichuExe/Whatsapp-Bot'
	};
	let exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
	let jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
	let exif = Buffer.concat([exifAttr, jsonBuffer]);
	exif.writeUIntLE(jsonBuffer.length, 14, 4);
	await img.load(stickerBuffer)
	img.exif = exif
	return await img.save(null)
}

async function addExifToWebP(buffer, options) {
	const outputFilePath = await createFile('webp');
	const inputFilePath = await createTmpFile(buffer, "webp");
	if (options.packName || options.authorName) {
		const img = new webp.Image();
		const json = {
			"sticker-pack-id": `https://github.com/KichuExe`,
			"sticker-pack-name": options.packName,
			"sticker-pack-publisher": options.authorName,
			emojis: options.categories ? options.categories : [""]
		};
		const exifAttr = await Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
		const jsonBuff = await Buffer.from(JSON.stringify(json), "utf-8");
		const exif = await Buffer.concat([exifAttr, jsonBuff]);
		await exif.writeUIntLE(jsonBuff.length, 14, 4);
		await img.load(inputFilePath);
		img.exif = exif;
		await img.save(outputFilePath);
		const stickerBuffer = fs.readFileSync(outputFilePath);
    fs.unlinkSync(outputFilePath);
		return stickerBuffer;
	}
}

async function imageToWebP(buffer, exif) {
	const outputFilePath = await createFile('webp');
	const inputFilePath = await createTmpFile(buffer, "jpg");
	await new Promise((resolve, reject) => {
		ffmpeg(inputFilePath).on('error', (err) => {
			console.error('Error during conversion:', err);
			reject(err);
		}).on('end', () =>
			resolve(true)).addOutputOptions(['-vcodec', 'libwebp', "-vf", "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse"]).toFormat('webp').save(outputFilePath);
	});
	const buff = fs.readFileSync(outputFilePath);
	fs.unlinkSync(outputFilePath);
	fs.unlinkSync(inputFilePath);
	if (!exif) {
		return buff;
	} else {
		return await addStickerMetaData(buff, {
			packName: exif.packName,
			authorName: exif.authorName
		});
	}
}

async function videoToWebP(buffer, exif) {
	const outputFilePath = await createFile('webp');
	const inputFilePath = await createTmpFile(buffer, "mp4");
	await new Promise((resolve, reject) => {
		ffmpeg(inputFilePath).on('error', (err) => {
			console.error('Error during conversion:', err);
			reject(err);
		}).on('end', () =>
			resolve(true)).addOutputOptions(["-vcodec", "libwebp", "-vf", "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse", "-loop", "0", "-ss", "00:00:00", "-t", "00:00:05", "-preset", "default", "-an", "-vsync", "0"]).toFormat('webp').save(outputFilePath);
	});
	const buff = fs.readFileSync(outputFilePath);
	fs.unlinkSync(outputFilePath);
	fs.unlinkSync(inputFilePath);
	if (!exif) {
		return buff;
	} else {
		return await addStickerMetaData(buff, {
			packName: exif.packName,
			authorName: exif.authorName
		});
	}
}

async function quote(profilePicture, name, text) {
	try {
		const payload = {
			type: 'quote',
			format: 'png',
			backgroundColor: '#FFFFFF',
			width: 552,
			height: 718,
			scale: 2,
			messages: [{
				entities: [],
				avatar: true,
				from: {
					id: 1,
					name,
					photo: {
						url: profilePicture
					}
				},
				text,
				replyMessage: {}
			}]
		};

		const { body } = await request(
			'https://bot.lyo.su/quote/generate', {
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify(payload)
			}
		);

		const data = await body.json();

		return Buffer.from(data.result.image, 'base64');
	} catch (error) {
		console.error('Quote Generation Error:', error);
		return null;
	}
}

module.exports = { upload, createTmpFile, createFile, addStickerMetaData, addExifToWebP, imageToWebP, videoToWebP, toAudio, addAudioMetaData, quote };
