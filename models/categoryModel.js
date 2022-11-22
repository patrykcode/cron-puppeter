const Model = require('./Model')

module.exports = class CategoryModel extends Model {
  constructor(db) {
    super(db);
    this.db = db
    this.table = 'categories'
    this.id_primary = 'id_category'

    this.id_category = 0,
      this.id_parent = 0,
      this.comparable = 0,
      this.boutique = 0,
      this.productCount = 0,
      this.imageUrl = '',
      this.mobileImageUrl = '',
      this.thumbnailUrl = '',
      this.name = '',
      this.slug = '',
      this.preferredDisplayStyle = '',
      this.status = 0,

      this.columns = [
        'id_category',
        'id_parent',
        'comparable',
        'boutique',
        'productCount',
        'imageUrl',
        'mobileImageUrl',
        'thumbnailUrl',
        'name',
        'slug',
        'preferredDisplayStyle',
        'status'
      ]
  }

  /**
   * Lista kategorii do pobrania
   * @param {*} limit 
   * @returns 
   */
  async getCategories(limit = 15) {
    const result = await this.db.query(`SELECT * FROM ${this.table} WHERE status=? AND productCount>0 LIMIT ${limit}`, [0])
    return !result.length ? [] : result[0]
  }

  async getAllImage() {
    const result = await this.db.query(`SELECT id_category, imageUrl, mobileImageUrl, thumbnailUrl FROM ${this.table} WHERE 1`, [])
    return !result.length ? [] : result[0]
  }

  async saveImage(id_category, images) {
    const query = []

    if (images.imageUrlLocal) {
      query.push(`imageUrlLocal='${images.imageUrlLocal}'`)
    }
    
    if (images.mobileImageUrlLocal) {
      query.push(`mobileImageUrlLocal='${images.mobileImageUrlLocal}'`)
    }

    if (images.thumbnailUrlLocal) {
      query.push(`thumbnailUrlLocal='${images.thumbnailUrlLocal}'`)
    }

    if (query.length > 0) {
      await this.db.query(`UPDATE ${this.table} SET ${query.join(', ')} WHERE ${this.id_primary}=?`, [id_category])
    }
  }
}
