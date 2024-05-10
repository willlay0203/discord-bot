require('dotenv').config()

/**
 * This command lists a sorted list of everyone's points
 * @param {string} message 
 * @param {*} command 
 */

const db = require('../app.js')

const points = () => {
    try {
        const res = db.db("points-db").collection("Users").find();
        console.log(res)
    } catch (error) {
        console.error("error updating");
    } finally {
      db.close();
    }
}

module.exports = points;