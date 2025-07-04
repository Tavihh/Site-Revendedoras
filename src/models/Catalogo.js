const { DataTypes } = require('sequelize')
const sequelize = require('./db')
const User = require('./User')

const Catalogo = sequelize.define('catalogo',{
   UUID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
    },
    nomeCatalogo:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true,
    },
    corFundo:{
        type:DataTypes.STRING,
        allowNull:false,
        defaultValue:'#f7f7f7'
    },
    telefone:{
        type:DataTypes.STRING,
        allowNull:false
    },
    status:{
        type:DataTypes.BOOLEAN,
        allowNull:false,
        defaultValue:false
    },
    
},{freezeTableName:true})

Catalogo.belongsTo(User, {
    foreignKey: 'fk_id',
    targetKey: 'id',
})

Catalogo.sync().then(()=>{
    console.log("Tabela 'Catalogo' OK")
}).catch((err)=>{
    console.log("Tabela 'Catalogo' Não OK, ERRO:",err)
})
''
module.exports = Catalogo