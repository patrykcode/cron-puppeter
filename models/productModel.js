const Model = require('./Model')

module.exports = class ProductModel extends Model {
  constructor(db) {
    super(db);
    this.db = db
    this.table = 'products'
    this.id_primary = 'id_product'

    this.id_product = 0,
      this.eancode = '',
      this.adultsOnly = 0,
      this.ageConfirmed = 0,
      this.brandName = '',
      this.categories = 0,
      this.categoryId = 0,
      this.categoryName = 0,
      this.defaultVariant = '',
      this.selectedVariant = '',
      this.downloadDetials = '',
      this.inCategories = '',
      this.isNewProduct = 0,
      this.isNonFood = 0,
      this.shipmentDays = 0,
      this.stockInfos = ''


    this.columns = [
      'id_product',
      'eancode',
      'adultsOnly',
      'ageConfirmed',
      'brandName',
      'categories',
      'categoryId',
      'categoryName',
      'defaultVariant',
      'selectedVariant',
      'downloadDetials',
      'inCategories',
      'isNewProduct',
      'isNonFood',
      'shipmentDays',
      'stockInfos'
    ]
  }

  async getAllImage() {
    const result = await this.db.query(`SELECT id, id_product, defaultVariant, selectedVariant FROM ${this.table} WHERE 1`, [])
    return !result.length ? [] : result[0]
  }

  async saveImage(id_product, images) {
    await this.db.query(`UPDATE ${this.table} SET imageLocal=? WHERE ${this.id_primary}=?`, [JSON.stringify(images), id_product])
  }
}
