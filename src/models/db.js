const { Sequelize } = require('sequelize')
require('dotenv').config({path:'.env'})

const sequelize = new Sequelize({
    storage: './database.sqlite',
    dialect:'sqlite',
    logging:false
})

sequelize.authenticate().then(()=>{
    console.log("MySQL conectado!")
}).catch((err)=>{
    console.log("MySQL falhou!, Erro:",err)
})

module.exports = sequelize