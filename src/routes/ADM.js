// importações
const router = require('express').Router()

// rotas GET
router.get('/', (req,res) => {
    res.render('ADM/painel', {layout:'ADM'})
})



// exportação
module.exports = router