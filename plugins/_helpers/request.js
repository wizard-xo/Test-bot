const {request, fetch} = require('undici');
const {fromBuffer} = require('file-type');
const fs = require('fs');
const path = require('path');


async function getBuffer(url, options = {}) {
    try {
	    const res = await fetch(url);
        return Buffer.from(await res.arrayBuffer());
	
    } catch (err) {
	    try {
		    const res = await request(url);
        return Buffer.from(await res.body.arrayBuffer());
    } catch (err) {
        return null;
    }
    }
}


async function getJson(url, options = {}) {
    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
                ...(options.headers || {})
            },
            ...options
        });

        if (!res.ok) {
            throw new Error(`Request failed with status ${res.status}`);
        }

        const data = await res.json();
        return data;
    } catch (err) {
        console.error('Error fetching JSON:', err);
        return null;
    }
}


async function getFileDetails(PATH, returnAsFilename) {
    let filename;
    let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,` [1], "base64") : /^https?:\/\//.test(PATH) ? await getBuffer(PATH) : fs.existsSync(PATH) ? ((filename = PATH), fs.readFileSync(PATH)) : typeof PATH === "string" ? PATH : Buffer.alloc(0);
	if (!Buffer.isBuffer(data)) throw console.log("Result is not a buffer");
	let type = (await fromBuffer(data)) || {
        mime: "application/octet-stream",
        ext: ".bin"
    }
    if (data && returnAsFilename && !filename)(filename = path.join(__dirname, "../" + new Date() * 1 + "." + type.ext)),
        await fs.promises.writeFile(filename, data);
    return { filename: filename ? filename : Date.now() + '.' + type.ext, ...type, data };
}
    
module.exports = {getBuffer, getJson, getFileDetails};
