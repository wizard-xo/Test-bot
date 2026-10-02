const mentionPlugin = require('../lib/plugins.js');
const config = require('../config.js');


mentionPlugin.addPlugin(
  {
    on: 'text',
    fromMe: false,
    forcePublic: true
  },
  async ({message}) => {
    if (!message.fromMe && ([...config.SUDO.split(','), message.botJid?.split('@')[0]].some(number => message?.text?.includes(number)) || [...config.SUDO.split(','), message.botJid?.split('@')[0]].some(number => message.mentions?.some(mention => mention?.startsWith(number))))) {
      const thumbnail = ['https://cdn.devstackx.in/P9v6a91DiIsI.jpg', 'https://cdn.devstackx.in/CWY0e4QyzkWZ.jpg', 'https://cdn.devstackx.in/5qj5Rw7NJUAW.jpg'];
      const audios = ['https://cdn.devstackx.in/pwkSqXgP5R9d.mp3', 'https://cdn.devstackx.in/IwhfKu5Xqf8F.mp3', 'https://cdn.devstackx.in/AiAVeyAcMnrY.mp3', 'https://cdn.devstackx.in/yaS0jq9x3BdV.mp3']
      return await message.sendMessage(message.jid, audios[Math.floor(Math.random() * audios.length)], { mimetype: 'audio/mpeg', ptt: true, quoted: message }, 'audio')
    }
  }
)

