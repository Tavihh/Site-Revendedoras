const Catalogo = require('../models/Catalogo')
module.exports = {
    temCatalogo: (req,res,next)=>{
        if(!req.user) {
            req.flash('error_msg','Você precisa estar logado')
            res.redirect('/login')
            return
        }
        if(req.user.eAdmin) {
            res.locals.layout = 'admin'
            res.redirect('/admin')
            return
        }
        Catalogo.findOne({where:{fk_id:req.user.id}}).then((catalogo) => {
            if(catalogo) {
                res.locals.layout = 'revendedora'
                next()
            } else {
                req.flash('success_msg','Falta criar o seu catalogo!')
                res.redirect('/registrar-catalogo')
                return
            }
        }).catch((err) => {
            req.flash('error_msg','Erro ao tentar encontrar Catalogo')
            console.log(err)
            res.redirect('/')
            return
        })
    }
}