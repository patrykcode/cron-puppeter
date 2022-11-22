const puppeteer = require('puppeteer');
const Cron = require('./cron');

// const express = require('express')
// const app = express()
// const port = 3013

require('dotenv').config()

const Db = require('./db');
const { dd } = require('./helpers/common');

const argv = (key) => {
    args = process.argv.slice(2)
    const a = {}
    args.map((i, j) => {
        if (i.indexOf('=') !== -1) {
            const e = i.split('=')
            a[e[0]] = e[1]
        } else {
            a[i] = i
        }

        return a
    })

    return a[key] || false
}

(async () => {


    const cron = new Cron(new Db(), argv('debug'))

    if (argv('install')) {
        dd('INSTALL TABLES')
        cron.install()
    }
    //node app.js images ic ip

    let delay = 0
    if (delay = argv('delay')) {
        dd('SET DELAY ', delay)
        cron.setDownload('delay', delay)
    }
    if (argv('ic')) {
        dd('SET download_image_category ', true)
        cron.setDownload('download_image_category', true)
    }

    if (argv('ip')) {
        dd('SET download_image_product ', true)
        cron.setDownload('download_image_product', true)
    }
    if (argv('categories') || argv('products') || argv('images')) {
        await cron.start('https://zakupy.cron.pl/');

        if (argv('categories')) {
            dd('START CATEGORIES')
            await cron.getCategories();
        }

        if (argv('products')) {
            dd('START PRODUCTS')
            await cron.getCategoryProducts();
        }

        if (argv('images')) {
            dd('START IMAGES')
            await cron.downloadImages()
        }

        await cron.close();
    }
})();

// app.get('/', (req, res) => res.send('API WORKING'))

