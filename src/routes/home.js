// importações
const router = require('express').Router()
const Produto = require('../models/Produto')
const { Op } = require('sequelize')
const passport = require('../config/auth')

// rotas GET
router.get('/', (req, res)=>{
    Produto.findAll({order:[['createdAt','DESC']]}).then((produto)=>{
        produto = produto.map((item)=>{
            item = item.toJSON()
            const [precoInteiro, precoDecimal] = item.preco.toFixed(2).toString().split('.')
            item.precoInteiro = precoInteiro
            item.precoDecimal = precoDecimal
            return item
        })
        res.render('home/index',{produto})
    }).catch((err)=>{
        console.log(err)
        res.status(404).send('Ocorreu um erro ao carregar os produtos, tente novamente')
    })
})

router.get('/login', (req, res)=>{
    if(req.user){
        res.redirect('/admin')
    } else {
        res.render('home/login')
    }
})

// rotas POST
router.post('/pesquisa', (req,res)=>{
    Produto.findAll({where:{nome:{[Op.like]: `%${req.body.psq}%`}}}).then((produto)=>{
        produto = produto.map((item)=>{
            item = item.toJSON()
            const [precoInteiro, precoDecimal] = item.preco.toFixed(2).toString().split('.')
            item.precoInteiro = precoInteiro
            item.precoDecimal = precoDecimal
            return item
        })
        res.render('home/index',{produto})
    }).catch((err)=>{
        console.log(err)
        res.status(404).send('Ocorreu um erro ao carregar os produtos, tente novamente')
    })
})

router.post('/login', (req,res,next)=>{
    passport.authenticate('local', {
        successRedirect:'/admin',
        failureRedirect:'/login',
        failureFlash:true
    })(req,res,next)

})

// exportação
module.exports = router