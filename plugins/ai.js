const convertersPlugins = require('../lib/plugins.js');
const { getJson } = require('./_helpers/request.js');
const { getSessionId, saveSessionId } = require('./_helpers/database/geminiAi.js');

convertersPlugins.addPlugin({
    pattern: 'gemini',
    desc: '',
    fromMe: false,
    category: 'ai'
},
   async({ match, client, message }) => {
     if(!match) return await message.sendMessage(message.jid, "```Please provide a prompt!```", { }, 'reply');
     await client.sendPresenceUpdate('composing', message.jid);
       const sessionId = await getSessionId(message.sender);
       const response = await getJson(sessionId ? `https://lord-x-api.vercel.app/api/ai/v1?prompt=${encodeURIComponent(match)}&chatId=${sessionId}` : `https://lord-x-api.vercel.app/api/ai/v1?prompt=${encodeURIComponent(match)}`);
       if(response?.chatId) {
           await saveSessionId(message.sender, response?.chatId);
       }
       await client.sendPresenceUpdate('paused', message.jid);
       return await message.sendMessage(message.jid, response?.result, { }, 'reply');
   })
