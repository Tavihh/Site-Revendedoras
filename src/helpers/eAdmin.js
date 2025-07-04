module.exports = {
    eAdmin: (req,res,next)=>{
        if(!req.user) {
            req.flash('error_msg','Você precisa estar logado')
            res.redirect('/login')
            return
        }
        if(req.user.eAdmin) {
            res.locals.layout = 'admin'
            next()
        }else {
            res.redirect('/revendedora')
        }
    }
}