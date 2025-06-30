module.exports = {
    eADM: (req,res,next)=>{
        if(!req.user) {
            req.flash('error_msg','Você precisa estar logado')
            res.redirect('/login')
            return
        }
        if(req.user.email != 'otaviosatago@gmail.com') {
            // req.flash('error_msg','Você precisa estar logado')
            res.redirect('/admin')
            return
        } else {
            next()
        }
    }
}