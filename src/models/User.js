const { DataTypes } = require('sequelize')
const sequelize = require('./db')

const User = sequelize.define('User',{
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
    },
    eAdmin:{
        type:DataTypes.BOOLEAN,
        allowNull:false
    }
    
},{freezeTableName:true})

User.sync().then(()=>{
    console.log("Tabela 'User' OK")
}).catch((err)=>{
    console.log("Tabela 'User' Não OK, ERRO:",err)
})
''
module.exports = User