const axios = require("axios");
const {
	getYouTubeVideoId,
    formatDuration
} = require("./tools.js");

const qualities = [1080, 720, 480, 360];

async function checkQuality(videoId, quality) {
	const payload = {
		videoId,
		format: "mp4",
		quality
	};

	const headers = {
		Accept: "*/*",
		"Content-Type": "application/json",
		Origin: "https://embed.dlsrv.online",
		Referer: `https://embed.dlsrv.online/v1/full?videoId=${videoId}`,
		"User-Agent": "Mozilla/5.0"
	};

	try {
		const {
			data
		} = await axios.post(
			"https://embed.dlsrv.online/api/download/mp4",
			payload, {
				headers
			}
		);
        
		if (!data?.url) return null;

		const title = data.filename.replace(/\(\d+p.*?\)/i, '').replace(/\.mp4$/i, '').trim();

		return {
			quality,
			title,
			duration: formatDuration(data.duration)
		};
	} catch {
		return null;
	}
}

async function getAvailableQualities(url) {
	const videoId = getYouTubeVideoId(url);
	if (!videoId) return null;

	const results = await Promise.all(
		qualities.map(q => checkQuality(videoId, q))
	);

	const valid = results.filter(Boolean);

	if (!valid.length) return null;

	return {
		title: valid[0].title,
        thumbnail: "https://img.youtube.com/vi/" + videoId + "/maxresdefault.jpg",
		duration: valid[0].duration,
		qualities: valid.map(v => v.quality)
	};
}

module.exports = {
	getAvailableQualities
};