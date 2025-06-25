// importações
const router = require('express').Router()
const Loja = require('../models/Loja')
const Produto = require('../models/Produto')

// rotas GET
router.get('/:id/:nomeLoja', (req, res)=>{
    const id = req.params.id
    const nomeLoja = req.params.nomeLoja

    Promise.all([
        Produto.findAll({where:{fk_id:id},order:[['createdAt','DESC']]}),
        Loja.findOne({where:{id,nomeLoja}})
    ]).then(([produto,loja]) => {
        produto = produto.map((item)=>{
            item = item.toJSON()
            const [precoInteiro, precoDecimal] = item.preco.toFixed(2).toString().split('.')
            item.precoInteiro = precoInteiro
            item.precoDecimal = precoDecimal
            return item
        })
        res.locals.loja = loja.toJSON()
        res.render('home/loja',{layout:'store',produto})
    }).catch((err)=>{
        console.log(err)
        res.render('home/lojaErrada')
    })
})

// rotas POST
router.post('/pesquisa/:id', (req,res)=>{
    Produto.findAll({where:{nome:{[Op.like]: `%${req.body.psq}%`}},fk_id:req.body.id}).then((produto)=>{
        produto = produto.map((item)=>{
            item = item.toJSON()
            const [precoInteiro, precoDecimal] = item.preco.toFixed(2).toString().split('.')
            item.precoInteiro = precoInteiro
            item.precoDecimal = precoDecimal
            return item
        })
        res.render('home/loja',{produto})
    }).catch((err)=>{
        console.log(err)
        res.status(404).send('Ocorreu um erro ao carregar os produtos, tente novamente')
    })
})


// exportação
module.exports = router