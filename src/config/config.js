// imports
const express = require('express')
const app = express()
const hbs = require('express-handlebars')
const session = require('express-session')
const flash = require('connect-flash')
const path = require('path')
const passport = require('passport')
const Loja = require('../models/Catalogo')


// helper

const handlebars = hbs.create({
  defaultLayout: 'main',
  helpers: {
    eq: (a, b) => a === b
  }
})


// config
process.noDeprecation = true
    // session
    app.use(session({
        secret:'comprascomMoni',
        resave:true,
        saveUninitialized:true,
    }))
    app.use(passport.initialize())
    app.use(passport.session())
    app.use(flash())
    // middleware
    app.use(async(req,res,next)=>{
        res.locals.error_msg = await req.flash('error_msg')
        res.locals.success_msg = await req.flash('success_msg')
        res.locals.error = await req.flash('error')
        res.locals.user = await req.user || null

        next()
    })
    // view engine
    app.engine('handlebars', handlebars.engine)
    app.set('view engine', 'handlebars')
    // json
    app.use(express.urlencoded({extended:true}))
    app.use(express.json())
    // public
    app.use(express.static(path.join(__dirname,'../public')))
    app.set('views', 'src/views')


module.exports = app