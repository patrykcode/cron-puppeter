'use strict'

const mysql = require('mysql2/promise')

module.exports = class Db {
  async query(sql, params) {
    try {
      const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_DATABASE
      })
      // console.log(db)

      const rows = await db.execute(sql, params)
      await db.end()

      return rows
    } catch (e) {
      console.error(e)
    }
  }
}
