const {
    default: makeWASocket,
	DisconnectReason,
	useMultiFileAuthState,
	Browsers,
	delay,
	getContentType,
	jidNormalizedUser,
    fetchLatestBaileysVersion,
	downloadMediaMessage,
	makeCacheableSignalKeyStore,
	generateWAMessageFromContent,
	generateWAMessage
} = require('baileys-duplicated');
const {Boom} = require('@hapi/boom');
const NodeCache = require("node-cache");
const config = require('../config.js');
const fs = require('fs');
const pino = require('pino');
const path = require('path');
const plugins = require('./plugins.js');
const {addExifToWebP, imageToWebP, videoToWebP} = require('../plugins/_helpers/converters.js');
const {isUrl} = require('../plugins/_helpers/tools.js');
const {getBuffer, getJson, getFileDetails} = require('../plugins/_helpers/request.js');
const {initializeExternalPlugins,parsePdm} = require('./client.js');
const { Contacts, saveContact } = require('../plugins/_helpers/database/contacts.js');
const { randomBytes } = require('crypto');
const { getReactionSession } = require('../plugins/_helpers/sessions.js');

const parseMessage = async (client, message) => {
	client.getJid = async (lid) => {
		if(!lid) return null;
		if (lid === client.user.lid?.replace(/:\d+(?=@)/, '') || lid === client.user.id || lid === client.user.id.replace(/:\d+(?=@)/, '')) return client.user.id.replace(/:\d+(?=@)/, '');
		try {
			const { jid } = await Contacts.findOne({
				where: lid.endsWith('@lid') ?  { lid } : { jid: lid },
				raw: true
			}) || {};
			return jid;
		} catch {
			return null;
		}
	}

	client.getName = async (jid) => {
		if(!jid) return null;
		if (jid === message.botJid || jid === client.user.id || jid === client.user.id.replace(/:(\d+)(?=@s\.whatsapp\.net)/, '')) return client.user.name;
		try {
			const contact = await Contacts.findOne({ where: { jid } });
			return contact?.senderName || null;
		} catch {
			return null;
		}
	}
	
	if (message.key) {
		message.id = message.key.id;
		message.fromMe = message.key.fromMe;
		message.isGroup = message.key.remoteJid.endsWith('@g.us');
        message.jid = message.isGroup ? message.key.remoteJid : message.key.remoteJidAlt;
	}
	message.prefix = !config.PREFIX ? '' : config.PREFIX;
	message.senderLid = message.isGroup ? message.key.participant : message.key.remoteJid;
	message.sender = message.isGroup ? message.key.participantAlt : message.fromMe ? client.user.id.replace(/:\d+/, "") : message.jid;
	message.senderName = message?.pushName;
	message.botJid = client.user.id.replace(/:(\d+)(?=@s\.whatsapp\.net)/, '');
	if (message.message) {
		message.type = await getContentType(message?.message);
		message.text = (message?.type === 'conversation') ? message?.message?.conversation : (message.type === 'imageMessage') ? message.message.imageMessage.caption : (message.type == 'videoMessage') ? message.message.videoMessage.caption : (message.type == 'extendedTextMessage') ? message.message.extendedTextMessage.text : (message.type == 'buttonsResponseMessage') ? message.message.buttonsResponseMessage.selectedButtonId : (message.type == 'listResponseMessage') ? message.message.listResponseMessage.singleSelectReply.selectedRowId : (message.type == 'templateButtonReplyMessage') ? message.message.templateButtonReplyMessage.selectedId : (message.type === 'messageContextInfo') ? (message.message.buttonsResponseMessage?.selectedButtonId || message.message.listResponseMessage?.singleSelectReply.selectedRowId || message.messageData) : '';
		message.messageData = (message.type == 'viewOnceMessage' ? message.message[message.type].message[await getContentType(message.message[message.type].message)] : message.message[message.type])
		message.reply_message = message.messageData?.contextInfo ? true : false;
	}
	//console.log(message.type)
	if (message.reply_message) {
		console.log(message.messageData)
		message.reply_message = {
			message: message.messageData.contextInfo.quotedMessage,
			id: message.messageData.contextInfo.stanzaId || false,
			senderLid: message.messageData.contextInfo.participant,
			sender: await client.getJid(message.messageData.contextInfo.participant) || false,
			fromMe: await client.getJid(message.messageData.contextInfo.participant) === client.user.id.replace(/:\d+/, ""),
		}
		message.reply_message.key = {
			id: message.messageData.contextInfo.stanzaId || false,
			fromMe: await client.getJid(message.messageData.contextInfo.participant) === client.user.id.replace(/:\d+/, ""),
			remoteJid: message.jid
		}
		message.reply_message.type = await getContentType(message.reply_message.message);
		let replyMsg = message?.reply_message?.message || {};
		let replyType = message?.reply_message?.type;
		message.reply_message.text = replyMsg.conversation || replyMsg[replyType]?.text || replyMsg[replyType]?.caption || replyMsg.caption || replyMsg.text || replyMsg.contentText || replyMsg.selectedDisplayText || replyMsg.title || false;
		message.reply_message.mentions = message.reply_message?.message?.[message.reply_message.type]?.contextInfo?.mentionedJid?.length ? message.reply_message.message[message.reply_message.type].contextInfo.mentionedJid : [];
		}
	message.isViewOnce = !!(message?.reply_message?.message?.imageMessage?.viewOnce || message?.reply_message?.message?.videoMessage?.viewOnce || message?.reply_message?.message?.audioMessage?.viewOnce);
	message.mentions = message.message?.[message.type]?.contextInfo?.mentionedJid?.length ? message.message[message.type].contextInfo.mentionedJid : [];
	message.download = async () => {
			return await downloadMediaMessage(message.reply_message ? message.reply_message : message, 'buffer', { reuploadRequest: client.updateMediaMessage })
	}
	message.sudo =  config.SUDO?.split(",").includes(message.sender?.split("@")[0]) || message.fromMe;

	message.isAdmin = async (jid) => {
        let id;
    if (jid.endsWith("@s.whatsapp.net")) {
        id = 'phoneNumber'
    } else {
        id = 'id'
    }
		const metadata = await client.groupMetadata(message.jid);
		const participant = metadata.participants.find(p => p[id] === jid);
		return participant?.admin === 'admin' || participant?.admin === 'superadmin';
	}

	message.onWhatsApp = async (jid) => {
		const exists = await client.onWhatsApp(jid);
		return exists && exists[0]?.exists ? true : false;
	}
	
	message.isParticipant = async (jid) => {
		let id;
		if(jid.endsWith('@s.whatsapp.net')) {
			id = 'phoneNumber';
		} else {
			id = 'id';
		}
		try {
			const metadata = await client.groupMetadata(message.jid);
			return metadata.participants.some(p => p.phoneNumber === jid);
		} catch {
			return false;
		}
	}

	message.sendMessage = async (jid, content, options = {}, type = 'text') => {
		switch (type.toLowerCase().trim()) {
			case 'text': {
				return await client.sendMessage(jid, {
					text: content,
					...options
				}, {
					...options
				});
			}
			break;
			case 'reply': {
				return await client.sendMessage(jid, {
					text: content
				}, {
					quoted: message
				});
			}
			break;
			case 'edit': {
				return await client.sendMessage(jid, {
					text: content,
					edit: options
				})
			}
			break;
			case 'react': {
				return await client.sendMessage(jid, {
					react: {
						text: content,
						key: options
					}
				});
			}
			break;
			case 'delete': {
				return await client.sendMessage(jid, {
					delete: content
				})
			}
			break;
			case 'image': {
				if (!Buffer.isBuffer(content) && !(isUrl(content))) return;
				return await client.sendMessage(jid, {
					image: Buffer.isBuffer(content) ? content : (isUrl(content)) ? await getBuffer(content) : null,
					...options
				}, {
					...options
				})
			}
			break;
			case 'video': {
				if (!Buffer.isBuffer(content) && !(isUrl(content))) return;
				return await client.sendMessage(jid, {
					video: Buffer.isBuffer(content) ? content : (isUrl(content)) ? await getBuffer(content) : null,
					...options
				}, {
					...options
				})
			}
			break;
			case 'audio': {
				if (!Buffer.isBuffer(content) && !(isUrl(content))) return;
				return await client.sendMessage(jid, {
					audio: Buffer.isBuffer(content) ? content : (isUrl(content)) ? await getBuffer(content) : null,
					...options
				}, {
					...options
				})
			}
			break;
            case 'document': {
				if (!Buffer.isBuffer(content) && !(isUrl(content))) return;
				return await client.sendMessage(jid, {
            document: Buffer.isBuffer(content) ? content : (isUrl(content)) ? await getBuffer(content) : null,
					...options
				}, {
					...options
				})
			}
			break;
			case 'sticker': {
				if (!Buffer.isBuffer(content) && !(isUrl(content))) return;
				const {data, mime} = await getFileDetails(content);
				return await client.sendMessage(jid, {
					sticker: mime === "image/webp" ? await addExifToWebP(data, options) : mime.startsWith("video") ? await videoToWebP(data, options) : mime.startsWith("image") ? await imageToWebP(data, options) : null
				}, options)
			}
			break;
			case "album": {
  if (!Array.isArray(content) || !content.length) {
    throw new Error("Album content must be an array.");
  }

  try {
    const imageCount = content.filter(m => m.image).length;
    const videoCount = content.filter(m => m.video).length;

    const album = await generateWAMessageFromContent(
      jid,
      {
        messageContextInfo: {
          messageSecret: randomBytes(32)
        },
        albumMessage: {
          expectedImageCount: imageCount,
          expectedVideoCount: videoCount
        }
      },
      {
        userJid: message.botJid,
        upload: client.waUploadToServer,
		...options
      }
    );

    await client.relayMessage(jid, album.message, {
      messageId: album.key.id
    });

    for (const media of content) {
      const msg = await generateWAMessage(jid, media, {
        upload: client.waUploadToServer,
		  ...options
      });

      msg.message.messageContextInfo = {
        messageSecret: randomBytes(32),
        messageAssociation: {
          associationType: 1,
          parentMessageKey: album.key
        }
      };

      await client.relayMessage(jid, msg.message, {
        messageId: msg.key.id
      });
    }

  } catch (err) {
    console.error('album:', err);
  }
}
  break;
		}
	}

	return message;
}


class WAConnection {
	constructor() {
		this.client = null;
		this.state = null;
		this.saveCreds = null;
	}

	async initWAConnection(session) {
		if (!session) {
            console.log('Please put session ID!');
            }
		const sessionDir = path.join(__dirname, 'session');
        try {
		fs.mkdirSync(sessionDir, {
			recursive: true
		});
        console.log('Creating ' + sessionDir + '/creds.json for the session: ' + session);
		const response = await getJson('https://gist.github.com/KichuExe/' + Buffer.from(session.split(':')[1], 'base64url').toString('hex') + '/raw');
            
            if(!response || Object.keys(response).length === 0) {
                console.log('Invalid session data received!');
            }
		fs.writeFileSync(path.join(sessionDir, 'creds.json'), JSON.stringify(response, null, 2), 'utf8');     
       console.log('Session successfully created! creds.json saved.');
            } catch (error) {
                console.log('Failed to save session: ' + error.message);
            }
		const {state, saveCreds} = await useMultiFileAuthState(sessionDir);
		this.state = state;
		this.saveCreds = saveCreds;
	}

	async start() {
		const groupCache = new NodeCache({
			stdTTL: 5 * 60,
			useClones: false
		});
        
		const { version } = await fetchLatestBaileysVersion();
        
		this.client = makeWASocket({
			auth: {
				creds: this.state.creds,
				keys: makeCacheableSignalKeyStore(this.state.keys, pino({
					level: 'silent'
				}))
			},
			printQRInTerminal: false,
			browser: ["Ubuntu", "Chrome", "20.0.04"],
			logger: pino({
				level: 'silent'
			}),
			syncFullHistory: false,
			markOnlineOnConnect: false,
			getMessage: false,
            version,
			emitOwnEvents: false,
                        generateHighQualityLinkPreview: true,
                        defaultQueryTimeoutMs: undefined,
			cachedGroupMetadata: async (jid) => groupCache.get(jid)
		});
		this.client.ev.on('connection.update', async ({
			connection,
			lastDisconnect
		}) => {
			if (connection === 'connecting') {
				console.log('Connecting to whatsapp...');
			} else if (connection === 'open') {
				console.log('Connected to whatsapp!');
				console.log('Installing plugins...');
				await this.loadPlugins();
				await initializeExternalPlugins();
			} else if (connection === 'close') {
				const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
				if (reason === DisconnectReason.connectionReplaced) {
					console.log('Connection replaced. Logout current session first.');
					await this.client.logout();
				} else {
					console.log('Reconnecting...');
					await delay(3000);
					await this.start();
				}
			}
		});
		this.client.ev.on('messages.upsert', async (m) => {
			const message = await parseMessage(this.client, JSON.parse(JSON.stringify(m.messages[0])));

			for(const msg of m.messages) {
				await saveContact(msg.key.remoteJid.endsWith('@g.us') ? msg.key.participantAlt : msg.key.remoteJidAlt, msg.key.remoteJid.endsWith('@g.us') ? msg.key.participant : msg.key.remoteJid, msg.pushName);
			}
	
			await this.client.sendPresenceUpdate('unavailable')
			plugins.plugins.forEach(async (plugin) => {
				if (plugin.fromMe && !message?.sudo) return;
				const pattern = message?.text ? message.text[0].toLowerCase() + message.text.slice(1) : '';
				if (plugin.on) {
					plugin.function({
						match: message?.text,
						message,
						client: this.client
					});
				} else if (plugin.pattern && plugin.pattern.test(pattern) && pattern.toLowerCase().startsWith(message.prefix.trim().toLowerCase())) {
					plugin.function({
						match: message?.text.replace(plugin.pattern, '$1').trim(),
						message,
						client: this.client
					});
				}
			});
		});
		this.client.ev.on('messages.reaction', async (reactions) => {
			for (const reaction of reactions) {
				//console.log(reaction);
				if(!reaction?.reaction?.text) return;
				const session = getReactionSession(reaction.key.id);
				if(!session || reaction.reaction.key.participantAlt !== session.user) return;
				if(reaction?.reaction?.text === '❤️') {
					return await this.client.sendMessage(reaction?.key?.remoteJid, { text: "Reply message done to the reaction ❤️." })
				} else if(reaction?.reaction?.text === '💦') {
					return await this.client.sendMessage(reaction?.key?.remoteJid, { text: "Reply message done to the reaction 💦." })
				}
				/*const session = getReactionSession(reaction.key.id);
				console.log("Reaction text: ", reaction?.reaction?.text);
				console.log("\nMessage id: ", reaction?.key?.id);
				console.log("\nSession: ", session);
				console.log("Participant: ", reaction?.reaction?.key?.participantAlt);
				console.log("Sender: ", session?.user);*/
			}
		})
		this.client.ev.on('creds.update', async () => {
			await this.saveCreds()
		});
		this.client.ev.on('groups.update', async ([event]) => {
			const metadata = await this.client.groupMetadata(event.id)
			groupCache.set(event.id, metadata)
		})
		this.client.ev.on('group-participants.update', async (update) => {
			const metadata = await this.client.groupMetadata(update.id)
			groupCache.set(update.id, metadata)
			await parsePdm(this.client, update);
		})
		return this.client;
	}

	async loadPlugins() {
		fs.readdirSync(path.join(__dirname, '../plugins'))
			.filter((file) => path.extname(file) === '.js')
			.forEach(async (file) => {
				require(`../plugins/${file}`);
			});
		console.log('Plugins installed');
	}
	
}

module.exports = WAConnection;
