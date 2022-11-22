const { exit } = require('process')
const puppeteer = require('puppeteer')
const { dd, delay, tab, download, fileName } = require('./helpers/common')
const CategoryModel = require('./models/categoryModel')
const ProductModel = require('./models/productModel')
const Model = require('./models/Model')

module.exports = class CRON {
    constructor(db, debug = true) {
        this.db = db
        this.page = false
        this.browser = false
        this.debug = debug
        this.download_image_category = false
        this.download_image_product = false
        this.delay = 0
    }

    setDownload(key, value) {
        this[key] = value
        return this
    }
    /**
     * otwieramy przeglądarkę
     * @returns 
     */
    async createBrowser() {
        dd('create new browser')

        try {
            this.browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                headless: !this.debug,
                devtools: this.debug,
                userDataDir: './data/session'
            })

            return this.browser
        } catch (e) {
            dd('ERROR createBrowser', e)
        }
        return false;
    }

    async close() {
        this.browser.close()
    }

    async install() {
        await (new Model(this.db)).install()
    }
    /**
     * zwraca pierwsza strone/zakładkę
     * @returns 
     */
    async getPage() {
        return await this.browser.targets()[this.browser.targets().length - 1].page() || await this.browser.newPage();
    }

    /**
     * Ładowanie strony startowej
     * @param {*} start_url 
     */
    async start(start_url) {
        await this.createBrowser();

        if (!this.browser) {
            dd('BROWSER NOT FOUND');
            exit(22);
        }

        this.page = await this.getPage();

        if (!this.page) {
            dd('PAGE NOT FOUND');
            exit(22);
        }

        await this.page.goto(start_url);
    }

    async getCategories(id_category = 0, lvl = 0, parent) {

        await delay(this.delay)

        const category = await this.page.evaluate(id_category => {
            return $nuxt.$store.$api.$get("/tree/".concat(id_category)).then(resp => {
                return resp
            })
        }, id_category);

        if (category) {

            dd(tab(lvl) + 'PARENT ', category.name, "lvl:" + lvl, "CHILD:" + category.children.length)
            await (new CategoryModel(this.db)).params(category, parent?.id || 0).save();

            lvl++
            if (category.children) {
                for (let i in category.children) {
                    const child = category.children[i]

                    dd(tab(lvl) + 'CATEGORY ', child.id, child.name, "lvl:" + lvl, "CHILD:" + child.children?.length || 0)
                    await (new CategoryModel(this.db)).params(child, category?.id || 0).save();

                    if (child.children.length > 0) {
                        await this.getCategories(child.id, lvl, category)
                    }
                }
            }
        }
    }

    async getProducts(obj) {
        return await this.page.evaluate(({ id_category, page, selector, limit = 15 }) => {
            const url = `products?page=${page}&itemsPerPage=${limit}&${selector}=${id_category}&hl=pl`
            return $nuxt.$store.$api.$get(url).then(resp => {
                return resp
            }).catch(() => {
                return []
            })

        }, obj);
    }

    async getProductDetails(product) {

        const productDetails = []

        if (product?.selectedVariant && product?.selectedVariant?.details) {
            const selectedVariant = product.selectedVariant
            for (let i in selectedVariant.details) {
                const section = selectedVariant.details[i];
                const base_url = "/products/"
                    .concat(selectedVariant.id, "/variants/")
                    .concat(selectedVariant.selectValue, "/details/", section)

                const result = await this.page.evaluate((url) => {
                    return $nuxt.$store.$api.$get(url).then(resp => {
                        return resp
                    }).catch(() => {
                        return []
                    })
                }, base_url);

                if (result) {
                    productDetails.push(result)
                }
            }
        }

        return productDetails
    }

    async saveProducts(products) {

        for (let i in products) {
            const product = products[i];

            const model = new ProductModel(this.db);
            dd(tab(4) + 'PRODUCT DOWNLOAD : ', product.id, product.eancode);
            product.downloadDetials = await this.getProductDetails(product)
            // dd(product.downloadDetials)
            await model.params(product).save();
        }
    }

    async getCategoryProducts(category_page = 0, download = 1) {

        const model = new CategoryModel(this.db)
        const categories = await model.getCategories();
        const ids = [];
        for (let i in categories) {
            const category = categories[i];
            if (category.id_category) {
                dd('CATEGORY DOWNLOAD : ', category.id_category, category.name);
                let page = 1;
                let pageCount = 1;
                if (download) {
                    while (page <= pageCount) {
                        const data = await this.getProducts({
                            id_category: category.id_category,
                            page: page++,
                            selector: category?.boutique ? 'boutiqueId' : 'categoryId'
                        })
                        pageCount = data?.pageCount || 1;
                        dd('PAGE COUNT : ', pageCount, 'PAGE: ', page, 'RESULTS COUNT: ', data?.results?.length);

                        if (data?.results) await this.saveProducts(data.results)
                        await delay(this.delay)
                    }
                }
                ids.push(category.id_category)
            }
        }

        if (ids.length) {
            await model.setStatus(ids)
            await this.getCategoryProducts()
        } else {
            dd('NO MORE CATEGORIES')
        }

    }

    async downloadImages() {
        //UPDATE `categories` SET `imageUrlLocal` = NULL, `mobileImageUrlLocal` = NULL, `thumbnailUrlLocal` = NULL WHERE 1;

        if (this.download_image_category) {
            const model = new CategoryModel(this.db)

            const resuts = await model.getAllImage()

            if (resuts) {

                for (let i in resuts) {
                    await delay(this.delay)
                    const category = resuts[i]
                    const images = {
                        imageUrlLocal: '',
                        mobileImageUrlLocal: '',
                        thumbnailUrlLocal: ''
                    }
                    if (category?.imageUrl) {
                        const imageUrl = fileName(category.imageUrl);
                        images.imageUrlLocal = await download(imageUrl.url, imageUrl.local);
                    }

                    if (category?.mobileImageUrl) {
                        const mobileImageUrl = fileName(category.mobileImageUrl);
                        images.mobileImageUrlLocal = await download(mobileImageUrl.url, mobileImageUrl.local);
                    }

                    if (category?.thumbnailUrl) {
                        const thumbnailUrl = fileName(category.thumbnailUrl);
                        images.thumbnailUrlLocal = await download(thumbnailUrl.url, thumbnailUrl.local);
                    }
                    // dd('DOWNLOAD IMAGE', JSON.stringify(images))
                    await model.saveImage(category.id_category, images)
                }
            }
        }

        if (this.download_image_product) {
            const p_model = new ProductModel(this.db)
            const p_resuts = await p_model.getAllImage()

            if (p_resuts) {

                for (let j in p_resuts) {

                    const product = p_resuts[j]

                    if(product.id < 3250){
                        dd('SKIP',j)
                        continue;
                    }

                    await delay(this.delay)
                    
                    const images = {}
                    let media
                    
                    try {
                        if (product?.defaultVariant && (media = JSON.parse(product?.defaultVariant)?.media)) {
                            if (media?.images) {
                                images.images = []
                                for (let i in media.images) {
                                    const imageUrl = fileName(media.images[i], 'images/product/');
                                    images.images[i] = await download(imageUrl.url, imageUrl.local);
                                }
                            }

                            if (media?.listImage) {
                                const imageUrl = fileName(media.listImage, 'images/product/');
                                images.listImage = await download(imageUrl.url, imageUrl.local);
                            }

                            if (media?.mainImage) {
                                const imageUrl = fileName(media.mainImage, 'images/product/');
                                images.mainImage = await download(imageUrl.url, imageUrl.local);
                            }
                            p_model.saveImage(product.id_product, images)
                        } else {
                            dd(media)
                        }
                    } catch (e) {
                        p_model.saveImage(product.id_product, {})
                        dd('PROBLM Z PARSEM')
                    }
                }
            }

        }

    }

}