const {sizeFormatter} = require('human-readable');

function formatSize(size) {
	const formatter = sizeFormatter({
		std: 'JEDEC',
		decimalPlaces: 2,
		keepTrailingZeroes: false,
		render: (literal, symbol) => `${literal} ${symbol}B`,
	});
	return formatter(size);
}

function formatNumberToJid(input) {
  const n = input.replace(/\D/g, '');
  return /^\d{10,15}$/.test(n) ? n + '@s.whatsapp.net' : null;
}

function formatNumber(input) {
	input = input.toString();
	return /^(\+)?\d{8,15}$/.test(input) ? input.replace(/^(\d)/, '+$1') : false;
};

function getPlatform() {
	return process.env.PWD?.includes("userland") ? "LINUX" : process.env.PITCHER_API_BASE_URL?.includes("codesandbox") ? "CODESANDBOX" : process.env.REPLIT_USER ? "REPLIT" : process.env.AWS_REGION ? "AWS" : process.env.TERMUX_VERSION ? "TERMUX" : process.env.DYNO ? "HEROKU" : process.env.KOYEB_APP_ID ? "KOYEB" : process.env.GITHUB_SERVER_URL ? "GITHUB" : process.env.RENDER ? "RENDER" : process.env.RAILWAY_SERVICE_NAME ? "RAILWAY" : process.env.VERCEL ? "VERCEL" : process.env.DIGITALOCEAN_APP_NAME ? "DIGITALOCEAN" : process.env.AZURE_HTTP_FUNCTIONS ? "AZURE" : process.env.NETLIFY ? "NETLIFY" : process.env.FLY_IO ? "FLY_IO" : process.env.CF_PAGES ? "CLOUDFLARE" : process.env.SPACE_ID ? "HUGGINGFACE" : "VPS";
}

function runtime() {
	seconds = Number(`${process.uptime()}`);
	var d = Math.floor(seconds / (3600 * 24));
	var h = Math.floor(seconds % (3600 * 24) / 3600);
	var m = Math.floor(seconds % 3600 / 60);
	var s = Math.floor(seconds % 60);
	var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
	var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
	var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
	var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
	return dDisplay + hDisplay + mDisplay + sDisplay;
}

function uptime() {
	const duration = process.uptime();
	const seconds = Math.floor(duration % 60);
	const minutes = Math.floor((duration / 60) % 60);
	const hours = Math.floor((duration / (60 * 60)) % 24);
	const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	return formattedTime;
}

function isUrl(url) {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

function includesAnyUrls(text) {
	return /(https?:\/\/[^\s]+)/g.test(text);
}

function extractUrlsFromText(text) {
	return text.match(/(https?:\/\/[^\s]+)/g) || [];
}

function extractInstagramUrls(urls) {
	return urls.filter(url => /^https?:\/\/(?:www\.)?instagram\.com\/(reel|reels|p|stories)\/[A-Za-z0-9._%-]+/.test(url));
}

function extractYouTubeUrls(urls) {
	return urls.filter(url => /^https?:\/\/(?:www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]{11}/.test(url));
}

function isInstagramStoryUrl(url) {
	return /^https?:\/\/(www\.)?instagram\.com\/stories\/[^\/]+(\/\d+)?\/?(\?.*)?$/.test(url);
}

function isFacebookReelsOrVideoUrl(url) {
	return /^https:\/\/www\.facebook\.com\/share\/(v|r)\/[a-zA-Z0-9]+\/?$/.test(url);
}

function formatDescription(input) {
	return input.replace(/([^\n]+)/g, (match) => match.trim()).trim();
}

function extractGroupInvitationCode(link) {
  const match = link.match(/^https?:\/\/chat\.whatsapp\.com\/([A-Za-z0-9]{20,})$/);
  return match ? match[1] : null;
}

function normalizeGistUrls(urls) {
  const normalized = urls
    .filter(url => /^https:\/\/gist\.github\.com\/[^\/]+\/[a-f0-9]+(\/raw)?\/?$/.test(url))
    .map(url =>
      url.replace(
        /^(https:\/\/gist\.github\.com\/[^\/]+\/[a-f0-9]+)(?!\/raw)(\/?)$/,
        "$1/raw"
      )
    );

  return normalized.length > 0 ? normalized : false;
}

function isYouTubeUrl(url) {

	if (!url || typeof url !== "string") return false;

	try {

		const parsed = new URL(url.trim());

		const host = parsed.hostname.replace("www.", "").replace("m.", "");

		if (host !== "youtube.com" && host !== "youtu.be") return false;

		if (host === "youtu.be") {

			return parsed.pathname.length > 1;

		}

		if (parsed.searchParams.get("v")) {

			return true;

		}

		if (parsed.pathname.startsWith("/shorts/")) {

			const id = parsed.pathname.split("/")[2];

			return !!id;

		}

		return false;

	} catch {

		return false;

	}

}

function isSpotifyTrack(url) {
	if (!url || typeof url !== "string") return false;

	try {
		const parsed = new URL(url.trim());
		const host = parsed.hostname.replace("www.", "");

		if (host !== "open.spotify.com" && host !== "spotify.com") return false;

		const parts = parsed.pathname.split("/").filter(Boolean);

		if (parts[0] !== "track") return false;
		if (!parts[1]) return false;

		return true;
	} catch {
		return false;
	}
}

function isInstagramMedia(url) {

	if (!url || typeof url !== "string") return false;

	try {

		const parsed = new URL(url.trim());

		const host = parsed.hostname.replace("www.", "");

		if (host !== "instagram.com") return false;

		const parts = parsed.pathname.split("/").filter(Boolean);

		if (parts.length === 0) return false;

		const type = parts[0];

		if (type === "reel" || type === "reels") return !!parts[1];

		if (type === "p") return !!parts[1];

		if (type === "stories") return parts.length >= 3;

		if (type === "s") return true;

		return false;

	} catch {

		return false;

	}

}

function isPinterestPost(url) {

	if (!url || typeof url !== "string") return false;

	try {

		const parsed = new URL(url.trim());

		const host = parsed.hostname.replace("www.", "");

		if (host === "pin.it") {

			return parsed.pathname.length > 1;

		}

		if (!host.endsWith("pinterest.com")) return false;

		const parts = parsed.pathname.split("/").filter(Boolean);

		if (parts.length < 2) return false;

		return parts[0] === "pin" && !!parts[1];

	} catch {

		return false;

	}

}

function getYouTubeVideoId(url) {
	try {
		const parsed = new URL(url);

		if (parsed.searchParams.has("list")) return null;

		if (parsed.hostname.includes("youtu.be")) return parsed.pathname.slice(1);

		if (parsed.pathname === "/watch") return parsed.searchParams.get("v");

		if (parsed.pathname.startsWith("/shorts/")) return parsed.pathname.split("/shorts/")[1];

		if (parsed.pathname.startsWith("/embed/")) return parsed.pathname.split("/embed/")[1];

		return null;
	} catch {
		return null;
	}
}

function formatDuration(sec) {
	sec = Number(sec);
	if (isNaN(sec) || sec < 0) return "0s";
	const m = Math.floor(sec / 60);
	const s = Math.floor(sec % 60);
	return m > 0 ? `${m} ${m === 1 ? 'minute' : 'minutes'} ${s} ${s === 1 ? 'second' : 'seconds'}` : `${s} ${s === 1 ? 'second' : 'seconds'}`;
}
		
module.exports = {
	extractYouTubeUrls,
	isInstagramStoryUrl,
	includesAnyUrls,
	extractUrlsFromText,
	extractInstagramUrls,
	formatSize,
	formatNumberToJid,
	formatNumber,
	getPlatform,
	runtime,
	uptime,
	isUrl,
	isFacebookReelsOrVideoUrl,
	formatDescription,
	extractGroupInvitationCode,
	normalizeGistUrls,
    isYouTubeUrl,
    isSpotifyTrack,
    isInstagramMedia,
    isPinterestPost,
    getYouTubeVideoId,
    formatDuration
};
