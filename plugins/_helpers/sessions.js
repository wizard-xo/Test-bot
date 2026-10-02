const sessions = new Map();

function saveIGSession(key, user, data) {
	sessions.set(key, {
		user,
		data
	});
	setTimeout(() => sessions.delete(key), 10 * 60 * 1000);
}

function getIGSession(key) {
	return sessions.get(key);
}

function savePinSession(key, user, data) {
	sessions.set(key, {
		user,
		data
	});
	setTimeout(() => sessions.delete(key), 10 * 60 * 1000);
}

function getPinSession(key) {
	return sessions.get(key);
}

function saveYtvSession(key, user, url, data) {
	sessions.set(key, {
		user,
        url,
		data
	});
	setTimeout(() => sessions.delete(key), 10 * 60 * 1000);
}

function getYtvSession(key) {
	return sessions.get(key);
}

function savePdmSession(key, user, data) {
	sessions.set(key, {
		user,
		data
	});
	setTimeout(() => sessions.delete(key), 10 * 60 * 1000);
}

function getPdmSession(key) {
	return sessions.get(key);
}

function saveReactionSession(key, user, timeout = 10 * 60 * 1000) {
  sessions.set(key, { user });

  setTimeout(() => {
    sessions.delete(key);
  }, timeout);
};

function getReactionSession(key) {
	return sessions.get(key);
} 

module.exports = { saveIGSession, getIGSession, savePinSession, getPinSession, saveYtvSession, getYtvSession, savePdmSession, getPdmSession, saveReactionSession, getReactionSession };
