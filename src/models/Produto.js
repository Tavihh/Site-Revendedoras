const { DataTypes } = require('sequelize')
const sequelize = require('./db')
const Loja = require('./Loja')

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

Produto.belongsTo(Loja, {
    foreignKey: 'fk_id',
    targetKey: 'id',
    onUpdate: 'CASCADE'
})

Produto.sync().then(()=>{
    console.log("Tabela 'Produtos' OK")
}).catch((err)=>{
    console.log("Tabela 'Produtos' Não OK, ERRO:",err)
})

module.exports = Produto