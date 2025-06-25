const { DataTypes } = require('sequelize')
const sequelize = require('./db')

const Loja = sequelize.define('loja',{
   UUID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
    },
    nomeLoja:{
        type:DataTypes.STRING,
        allowNull:false
    },
    telefone:{
        type:DataTypes.STRING,
        unique: true,
        allowNull:false
    },
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

Loja.sync().then(()=>{
    console.log("Tabela 'Loja' OK")
}).catch((err)=>{
    console.log("Tabela 'Loja' Não OK, ERRO:",err)
})
''
module.exports = Loja