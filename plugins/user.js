/**
 * WhatsApp-Bot
 * Copyright (c) 2026 KichuExe
 *
 * This project is licensed under the MIT License.
 * You are free to use, modify, and distribute this software
 * in accordance with the terms of the license.
 *
 * @author KichuExe
 * @license MIT
 */

const userPlugins = require('../lib/plugins.js');
const { formatNumberToJid } = require('./_helpers/tools.js');
const util = require('util');

userPlugins.addPlugin({
  on: 'text',
  fromMe: true,
}, async ({
  match,
  message,
  client
}) => {
  if (match && match.startsWith('<=>')) {
    try {
      let evaled = await eval(`(async () => { ${match.replace("<=>", "")} })()`);
      if (typeof evaled !== "string") evaled = util.inspect(evaled);
      return await message.sendMessage(message.jid, "```" + evaled + "```", {}, 'reply')
    } catch (e) {
      return await message.sendMessage(message.jid, "```" + util.format(e) + "```", {}, 'reply');
    }
  }
})

/**
 * Blocks a user via number, mention, or replied message.
 *
 * Usage:
 * .block 9179xxxxxxx
 * .block @user
 * (reply to a message) .block
 *
 * @param {object} ctx
 * @param {string} ctx.match - Command argument (phone number)
 * @param {object} ctx.message - Message object
 * @param {object} ctx.client - WhatsApp client instance
 * @returns {Promise<void>}
 */
userPlugins.addPlugin({
  pattern: 'block',
  desc: 'Block a contact.',
  fromMe: true,
  category: 'user'
}, async ({
  match,
  message,
  client
}) => {
  const jid = match ? formatNumberToJid(match) : message.isGroup ? (/^@?\d{10,15}$/.test(message.reply_message?.text || '') ? formatNumberToJid(message.reply_message.text) : null) || message.reply_message?.sender : message.jid;
  if (!jid) return await message.sendMessage(message.jid, "```Example: .block (9179xxxxxxxx / @mention a user / reply to a message)```", {}, 'reply');
  await message.sendMessage(message.jid, '```@' + jid.split('@')[0] + ' was blocked!```', {
    mentions: [jid],
    quoted: message
  }, 'text');
  const data = await client.updateBlockStatus(jid, 'block')
})

/**
 * Unblocks a user via number, mention, or replied message.
 *
 * Usage:
 * .unblock 9179xxxxxxx
 * .unblock @user
 * (reply to a message) .unblock
 *
 * @param {object} ctx
 * @param {string} ctx.match - Command argument (phone number)
 * @param {object} ctx.message - Message object
 * @param {object} ctx.client - WhatsApp client instance
 * @returns {Promise<void>}
 */
userPlugins.addPlugin({
  pattern: 'unblock',
  desc: 'Unblock a previously blocked contact.',
  fromMe: true,
  category: 'user'
}, async ({
  match,
  message,
  client
}) => {
  const jid = match ? formatNumberToJid(match) : message.isGroup ? (/^@?\d{10,15}$/.test(message.reply_message?.text || '') ? formatNumberToJid(message.reply_message.text) : null) || message.reply_message?.sender : message.jid;
  if (!jid) return await message.sendMessage(message.jid, "```Example: .unblock (9179xxxxxxxx / @mention a user / reply to a message)```", {}, 'reply');
  await message.sendMessage(message.jid, '```@' + jid.split('@')[0] + ' was unblocked!```', {
    mentions: [jid],
    quoted: message
  }, 'text');
  return await client.updateBlockStatus(jid, 'unblock')
})

/**
 * Leaves the current group with a farewell message.
 *
 * Usage:
 * .left
 *
 * @param {object} ctx
 * @param {object} ctx.message - Message object
 * @param {object} ctx.client - WhatsApp client instance
 * @returns {Promise<void>}
 */
userPlugins.addPlugin({
  pattern: 'left',
  desc: 'Leave a group.',
  fromMe: true,
  category: 'user'
}, async ({
  message,
  client
}) => {
  if (!message.isGroup) return;
  await message.sendMessage(message.jid, "```Bye bye everyone!```");
  return await client.groupLeave(message.jid);
})

/**
 * Joins a WhatsApp group using an invite link.
 *
 * Usage:
 * .join <group-invite-link>
 *
 * @param {object} ctx
 * @param {string} ctx.match - WhatsApp group invite link
 * @param {object} ctx.message - Message object
 * @param {object} ctx.client - WhatsApp client instance
 * @returns {Promise<void>}
 */
userPlugins.addPlugin({
  pattern: 'join',
  desc: 'Join a whatsapp group using invite link.',
  fromMe: true,
  category: 'user'
}, async ({
  match,
  message,
  client
}) => {
  if (!match) return await message.sendMessage(message.jid, "```Please provide a whatsapp group link.```", {}, 'reply');
  if (!/^(?:https?:\/\/)?chat\.whatsapp\.com\/(?:invite\/)?([a-zA-Z0-9_-]{22})(?:\?.*)?$/.test(match)) return await message.sendMessage(message.jid, "```Please provide valid group link!```", {}, 'reply');
  const data = await client.groupAcceptInvite(match.match(/^(?:https?:\/\/)?chat\.whatsapp\.com\/(?:invite\/)?([a-zA-Z0-9_-]{22})(?:\?.*)?$/)[1]);
  if (data.endsWith('@g.us')) {
    return await message.sendMessage(message.jid, "```Joined!```", {}, 'reply');
  } else {
    return await message.sendMessage(message.jid, "```Oops failed to join the group...```", {}, 'reply');
  }
})

/**
 * Reacts to a message with a specified emoji.
 *
 * Usage:
 * .react <emoji>
 * (reply to a message) .react <emoji>
 *
 * @param {object} ctx
 * @param {string} ctx.match - Emoji to react with
 * @param {object} ctx.message - Message object
 * @returns {Promise<void>}
 */
userPlugins.addPlugin({
  pattern: 'react',
  desc: 'React to messages with emojis.',
  fromMe: true,
  category: 'user'
}, async ({
  match,
  message
}) => {
  if (!match) return await message.sendMessage(message.jid, "```Please provide a emoji to react.```", {}, 'reply');
  return await message.sendMessage(message.jid, match, message.reply_message ? message.reply_message.key : message.key, 'react');
})

/**
 * Converts a view once message into a normal message.
 *
 * Usage:
 * (reply to a view-once message) .vv
 *
 * @param {object} ctx
 * @param {object} ctx.message - Message object
 * @returns {Promise<void>}
 */
userPlugins.addPlugin({
  pattern: 'vv',
  desc: 'Send view once messages as normal messages.',
  fromMe: true,
  category: 'user'
}, async ({
  message
}) => {
  if (!message.isViewOnce) return await message.sendMessage(message.jid, "```Reply to a view once message.```", {}, 'reply');
  try {
    return await message.sendMessage(message.jid, await message.download(), { mimetype: message?.reply_message?.message?.[message?.reply_message?.type]?.mimetype, ...(message?.reply_message?.type === 'audioMessage' && { ptt: true }), quoted: message }, message?.reply_message?.type === 'audioMessage' ? 'audio' : message?.reply_message?.type === 'videoMessage' ? 'video' : 'image');
  } catch {
    return await message.sendMessage(message.jid, "```Failed to sent.```", {}, 'reply');
  }
})

userPlugins.addPlugin({
  pattern: 'delete',
  desc: 'Delete messages.',
  fromMe: false,
  category: 'user'
}, async ({
  message
}) => {
  if(!message.reply_message) return await message.sendMessage(message.jid, "```Reply to a message!```", { }, 'reply');
  if(message.isGroup) {
    if(message.reply_message.fromMe) return await message.sendMessage(message.jid, message.reply_message.key, { }, 'delete');
    if (!message.sudo && !(await message.isAdmin(message.sender))) return await message.sendMessage(message.jid, '```You are not admin!```', {}, 'reply');
    if (!await message.isAdmin(message.botJid)) return await message.sendMessage(message.jid, "```I'm not an admin!```", {}, 'reply');
    return await message.sendMessage(message.jid, message.reply_message.key, { }, 'delete');
  }
  if(message.reply_message.fromMe) {
    return await message.sendMessage(message.jid, message.reply_message.key, { }, 'delete');
  }
})
