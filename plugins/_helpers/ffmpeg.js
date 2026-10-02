const ffmpeg = require("fluent-ffmpeg")
const NodeID3 = require("node-id3")
const fs = require("fs").promises
const {
	tmpdir
} = require("os")
const {
	join
} = require("path")
const crypto = require("crypto")
const {
	isUrl
} = require("./tools.js")
const {
	getBuffer
} = require("./request.js")

function tmp(ext) {
	return join(tmpdir(), crypto.randomBytes(6).toString("hex") + "." + ext)
}

function run(input, output, setup) {
	return new Promise((resolve, reject) => {
		const cmd = ffmpeg(input)

		if (setup) setup(cmd)

		cmd
			.save(output)
			.on("end", resolve)
			.on("error", reject)
	})
}

async function mp4ToMp3(buffer, meta = {}) {
	const input = tmp("mp4")
	const output = tmp("mp3")

	await fs.writeFile(input, buffer)

	await run(input, output, cmd => {
		cmd.noVideo().audioBitrate(192)
	})

	let data = await fs.readFile(output)

	const tags = {
		title: meta.title || "Whatsapp-Bot",
		artist: meta.artist || "KichuExe",
		album: meta.album || "DevStack",
		year: meta.year || new Date().getFullYear().toString()
	}

	let imageBuffer

	if (meta.image) {
		imageBuffer = Buffer.isBuffer(meta.image) ?
			meta.image :
			isUrl(meta.image) ?
			await getBuffer(meta.image) :
			null
	}

	if (!imageBuffer) {
		imageBuffer = await getBuffer("https://cdn.morphlix.in/4Hl4flAk.jpeg")
	}

	tags.image = {
		mime: "image/jpeg",
		type: {
			id: 3,
			name: "front cover"
		},
		description: "cover",
		imageBuffer
	}

	data = NodeID3.write(tags, data)

	await fs.unlink(input)
	await fs.unlink(output)

	return data
}

async function mp3ToMp4(buffer) {
	const audio = tmp("mp3")
	const output = tmp("mp4")

	await fs.writeFile(audio, buffer)

	await run(audio, output, cmd => {
		cmd
			.input("color=c=black:s=1280x720:r=30")
			.inputFormat("lavfi")
			.videoCodec("libx264")
			.audioCodec("aac")
			.outputOptions([
				"-map 0:a",
				"-map 1:v",
				"-shortest",
				"-pix_fmt yuv420p"
			])
	})

	const data = await fs.readFile(output)

	await fs.unlink(audio)
	await fs.unlink(output)

	return data
}

function toSeconds(t) {
	if (typeof t === "number") return t
	if (t.includes(":")) {
		const p = t.split(":").map(Number)
		return p.length === 2 ? p[0] * 60 + p[1] : p[0] * 3600 + p[1] * 60 + p[2]
	}
	return Number(t)
}

async function trimMp3(buffer, start, end) {
	const input = tmp("mp3")
	const output = tmp("mp3")

	await fs.writeFile(input, buffer)

	await run(input, output, cmd => {
		cmd.setStartTime(start)

		if (end) {
			const duration = toSeconds(end) - toSeconds(start)
			cmd.setDuration(duration)
		}

		cmd.audioCodec("libmp3lame").audioBitrate(192)
	})

	const data = await fs.readFile(output)

	await fs.unlink(input)
	await fs.unlink(output)

	return data
}

module.exports = {
	mp4ToMp3,
    mp3ToMp4,
    trimMp3
}
