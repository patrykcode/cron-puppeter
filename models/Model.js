const { dd } = require('../helpers/common.js')

module.exports = class Model {
  constructor(db) {
    this.db = db
    this.table = 'products'
    this.id_primary = 'id_product'

    this.columns = [
    ]
  }

  async exists(id) {
    console.log('exists:', [id])
    const exists = await this.db.query(
      `SELECT * FROM ' + this.table + ' WHERE ${this.id_primary}=? limit 1`,
      [id]
    )

    if (exists.length) {
      return !exists.length || exists[0]
    }

    return false
  }
  /**
   * Ustawienie wartości dla wymaganych pól
   * @param {*} category 
   * @param {*} id_parent 
   * @returns 
   */
  params(row, id_parent = null) {
    if (row[this.id_primary] = row.id) {
      if (id_parent !== null) {
        row.id_parent = id_parent
      }
      for (let i in this.columns) {
        if (this[this.columns[i]] != undefined) {
          this[this.columns[i]] = row[this.columns[i]] || this[this.columns[i]]
        }

      }
    }
    return this
  }

  /**
   * ustawienie statusu objektu
   * @param {*} ids 
   * @param {*} status 
   */
  async setStatus(ids, status = 1) {

    function IN_VALUE(l = 1, val = '?') {
      var a = [];
      for (var i = 0; i < l; i++) {
        a.push(val);
      }
      return a.join(',');
    }

    await this.db.query(`UPDATE ${this.table} SET status=${status} WHERE ${this.id_primary} IN (${IN_VALUE(ids.length)})`, ids)
  }

  /**
   * tworzenie lub edycja objektu
   * @returns 
   */
  async save() {
    for (const row of this.columns) {
      if (this[row] === null) {
        console.log('Column required!', row)
        return
      }
    }

    const data = [];

    for (let i in this.columns) {

      let value = typeof this[this.columns[i]] === 'boolean' ? Number(this[this.columns[i]]) : this[this.columns[i]]
      value = typeof this[this.columns[i]] === 'object' ? JSON.stringify(this[this.columns[i]].replace(/\\"/g, '\\"')) : value
      value = typeof value === 'string' ? value.replace(/'/g, "\\'") : value

      data.push(`${this.columns[i]}='${value}'`);
    }

    try {

      const query = [
        'INSERT INTO',
        this.table,
        'SET',
        data.join(', '),
        'ON DUPLICATE KEY UPDATE',
        data.join(', ')
      ].join(' ')

      const result = await this.db.query(query)

      if (result?.insertId) {
        this.id = result.insertId
      }

      return result
    } catch (e) {
      console.error(e)
    }
    return false

  }

  async install() {

    const tables = [
      {
        table: 'categories',
        sql: `CREATE TABLE IF NOT EXISTS \`categories\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`id_category\` int(11) DEFAULT NULL,
        \`id_parent\` int(11) DEFAULT NULL,
        \`productCount\` int(11) NOT NULL DEFAULT '0',
        \`status\` int(11) DEFAULT '0',
        \`name\` varchar(255) DEFAULT NULL,
        \`slug\` varchar(255) DEFAULT NULL,
        \`comparable\` int(11) DEFAULT NULL,
        \`boutique\` int(11) DEFAULT NULL,
        \`imageUrl\` varchar(255) DEFAULT NULL,
        \`mobileImageUrl\` varchar(255) DEFAULT NULL,
        \`thumbnailUrl\` varchar(255) DEFAULT NULL,
        \`imageUrlLocal\` varchar(255) DEFAULT NULL,
        \`mobileImageUrlLocal\` varchar(255) DEFAULT NULL,
        \`thumbnailUrlLocal\` varchar(255) DEFAULT NULL,
        \`preferredDisplayStyle\` varchar(500) DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`id_category\` (\`id_category\`) USING BTREE,
        KEY \`id_parent\` (\`id_parent\`)
      ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;`
      },

      {
        table: 'products',
        sql: `CREATE TABLE IF NOT EXISTS \`products\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`id_product\` int(11) NOT NULL,
        \`eancode\` varchar(50) DEFAULT NULL,
        \`adultsOnly\` int(11) DEFAULT NULL,
        \`ageConfirmed\` int(11) DEFAULT NULL,
        \`brandName\` varchar(255) DEFAULT NULL,
        \`categories\` text,
        \`categoryId\` int(11) DEFAULT NULL,
        \`categoryName\` varchar(255) DEFAULT NULL,
        \`defaultVariant\` text,
        \`selectedVariant\` text,
        \`downloadDetials\` text,
        \`imageLocal\` text,
        \`inCategories\` varchar(255) DEFAULT NULL,
        \`isNewProduct\` int(11) DEFAULT NULL,
        \`isNonFood\` int(11) DEFAULT NULL,
        \`shipmentDays\` int(11) DEFAULT NULL,
        \`stockInfos\` text,
        \`date_upd\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`id_product\` (\`id_product\`) USING BTREE
      ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;`
      }
    ]
    for (let i in tables) {
      dd('INSTALL TABLE: ', tables[i].table)
      await this.db.query(tables[i].sql)
    }
  }
}
