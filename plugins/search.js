const searchPlugins = require('../lib/plugins.js');
const { isUrl } = require('./_helpers/tools.js');
const { getJson } = require('./_helpers/request.js');

searchPlugins.addPlugin({
  pattern: 'igstalk',
  desc: 'Fetches instagram user profile details.',
  fromMe: false,
  category: 'search'
},
async ({ match, message }) => {

  match = match || message?.reply_message?.text;

  if (!match) return await message.sendMessage(
    message.jid,
    "```Please provide instagram username or profile url.```",
    {},
    'reply'
  );

  if (isUrl(match) && !/^https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9_.]+)\/?(?:\?[^\s]*)?$/i.test(match)) {
    return await message.sendMessage(
      message.jid,
      "```Please give me a valid instagram profile url.```",
      {},
      'reply'
    );
  }

  if (isUrl(match) && /^https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9_.]+)\/?(?:\?[^\s]*)?$/i.test(match)) {
    match = match.match(/^https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9_.]+)\/?(?:\?[^\s]*)?$/i)[1];
  }

  const response = await getJson(API + '/v1/igstalk?username=' + match);

  if (!response || !response?.response || !response?.response?.length) return;

  return await message.sendMessage(
    message.jid,
    response.response[0].profile_picture,
    {
      caption:
        "```" +
        `Username: ${response.response[0].username}
Name: ${response.response[0].name}

Bio: ${response.response[0].bio}

Followers: ${response.response[0].followers}
Following: ${response.response[0].following}
Posts: ${response.response[0].posts}

Account: ${response.response[0].private ? 'Private Account' : 'Public Account'}
Verified: ${response.response[0].verified ? 'Verified Account' : 'Not Verified Account'}` +
        "```"
    },
    'image'
  );

});
