const passport = require('passport')
const localStrategy = require('passport-local').Strategy
const Loja = require('../models/Loja')
const bcrypt = require('bcryptjs')

passport.use(new localStrategy({usernameField:'email',passwordField:'senha'}, (email,senha,done)=>{
    Loja.findOne({where:{email:email}}).then((usuario)=>{
        if(!usuario) {
            done(null,false,{message:'Usúario não cadastrado'})
        } else {
            
            bcrypt.compare(senha,usuario.senha).then((equal)=>{
                if(equal){
                    done(null,usuario)
                } else {
                    done(null,false,{message:'Usúario não cadastrado'})
                }
            }).catch((err)=>{
                done(null,false,{message:'Usúario não cadastrado'})
            })
        }
    }).catch((err)=>{
        done(null,false,{message:'Usúario não encontrado'})
    })
}))

passport.serializeUser((usuario,done)=>{
    done(null,usuario.id)
})

passport.deserializeUser((id,done)=>{
    Loja.findOne({where:{id:id}}).then((usuario)=>{
        if(usuario){
            done(null,usuario.toJSON())
        } else {
            done(null,false)
        }
    }).catch((err)=>{
        done(null,false)
    })
})

module.exports = passport