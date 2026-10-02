const dotenv = require('dotenv');
const fs = require('fs');

const toBool = (value) => {
	return value === "true";
}

if(fs.existsSync('./config.env')) {
  dotenv.config({
    path: './config.env'
  })
}

module.exports = {
	AUDIO_DATA: process.env.AUDIO_DATA || 'Whatsapp-Bot,By nova❤️, Devstack,https://cdn.morphlix.in/byaY6zcj.jpeg', //title,artist,album,cover image url
	DATABASE_URL: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_8hRUy3AioaHP@ep-polished-river-aim9v076-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require",
	STICKER_DATA: process.env.STICKER_DATA || 'nova !', //packname,authorname
	PORT: process.env.PORT || 4000,
	SESSION_ID: process.env.SESSION_ID || '10b8c0b5eb1bc9427582732a3696578a',
	PREFIX: (process.env.PREFIX || '#').trim(),
	SUDO: process.env.SUDO || '919497705819',
	WORK_TYPE: process.env.WORK_TYPE || 'public'
};
