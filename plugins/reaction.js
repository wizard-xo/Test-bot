const convertersPlugins = require('../lib/plugins.js');
const { saveReactionSession } = require('./_helpers/sessions.js');

convertersPlugins.addPlugin({
    pattern: 'reaction',
    desc: '',
    fromMe: false,
    category: 'lord'
},
   async({ message }) => {
     const sent = await message.sendMessage(
  message.jid,
  "```React with ❤️ to get a reply.\nReact with 💦 to get another reply.```",
  { quoted: message },
  'text'
);

return saveReactionSession(sent.key.id, message.sender);
   })
