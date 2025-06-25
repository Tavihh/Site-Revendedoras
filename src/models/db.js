const { Sequelize } = require('sequelize')
require('dotenv').config({path:'.env'})

const sequelize = new Sequelize({
    storage: './src/models/database.sqlite',
    dialect:'sqlite',
    logging:false
})

sequelize.authenticate().then(()=>{
    console.log("SQLite conectado!")
}).catch((err)=>{
    console.log("SQLite falhou!, Erro:",err)
})

module.exports = sequelize