const { DataTypes } = require('sequelize')
const sequelize = require('./db')

const User = sequelize.define('users',{
    nome:{
        type:DataTypes.STRING,
        allowNull:false
    },
    sobrenome:{
        type:DataTypes.STRING,
        allowNull:false
    },
    email:{
        type:DataTypes.STRING,
        unique:true,
        allowNull:false
    },
    senha:{
        type:DataTypes.STRING,
        allowNull:false
    }
},{freezeTableName:true})

User.sync({alter:true}).then(()=>{
    console.log("Tabela 'Users' OK")
}).catch((err)=>{
    console.log("Tabela 'Users' Não OK, ERRO:",err)
})

module.exports = User