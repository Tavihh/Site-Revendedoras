const { DataTypes } = require('sequelize')
const sequelize = require('./db')

const Loja = sequelize.define('loja',{
    nome:{
        type:DataTypes.STRING,
        allowNull:false
    },
    telefone:{
        type:DataTypes.STRING,
        unique: true,
        allowNull:false
    }
    
},{freezeTableName:true})

Loja.sync().then(()=>{
    console.log("Tabela 'Loja' OK")
}).catch((err)=>{
    console.log("Tabela 'Loja' Não OK, ERRO:",err)
})
''
module.exports = Loja