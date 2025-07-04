const { DataTypes } = require('sequelize')
const sequelize = require('./db')
const Catalogo = require('./Catalogo')

const Produto = sequelize.define('produtos',{
    nome:{
        type:DataTypes.STRING,
        allowNull:false
    },
    preco:{
        type:DataTypes.REAL,
        allowNull:false
    },
    path_foto:{
        type:DataTypes.TEXT,
        allowNull:false
    },
    link:{
        type:DataTypes.TEXT
    }
    
},{freezeTableName:true})

Produto.belongsTo(Catalogo, {
    foreignKey: 'fk_id',
    targetKey: 'id',
})

Produto.sync().then(()=>{
    console.log("Tabela 'Produtos' OK")
}).catch((err)=>{
    console.log("Tabela 'Produtos' Não OK, ERRO:",err)
})

module.exports = Produto