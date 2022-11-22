const fs = require('fs');
const request = require('request');


const HELPER = {
    download(uri, filename) {
        if (fs.existsSync(filename)) {
            HELPER.dd('File exists: ', filename)
            return filename
        }
        HELPER.dd('Download: ', filename)
        return new Promise((resolve, reject) => {
            try {
                request.head(uri, function (err, res, body) {
                    request(uri).pipe(fs.createWriteStream(filename)).on('close', () => {
                        resolve(filename)
                    });
                });
            } catch (e) { resolve(false) }
        });
    },
    fileName(url, dir = 'images/category/') {
        const image_name = decodeURIComponent(url)
            .replace('https://ecomplmvpprodwebblob0.blob.core.windows.net/zakupymvp/cache/', '')
            .replace(/\//g, '_').replace(/\,/g, '').replace(/\s+/g, '')
        return {
            url: url,
            local: dir + image_name
        }

    },
    dd() {
        const show = 1
        const debug = '%c [DEBUG] '
        const color = 'color:green;'
        if (show) {
            if (arguments.length === 1) {
                console.log(debug, color, arguments[0])
            } else {
                const data = []
                for (const i in arguments) {
                    data.push(arguments[i])
                }
                console.log(debug, color, data.join(' '))
            }
        }
    },
    async objectMap(array, callback) {
        const a = []
        for (const i in Object.keys(array)) {
            a.push(array[i])
        }
        return await Promise.all(a.map(async (e) => {
            await callback(e)
        }))
    },
    delay(time) {
        HELPER.dd(`waiting ${time}s...`)
        return new Promise(resolve => setTimeout(resolve, time * 1000));
    },
    tab(i) {
        let t = '';
        for (let j = 0; j <= i; j++) {
            t += '     '
        }
        return t
    }
}

module.exports = HELPER