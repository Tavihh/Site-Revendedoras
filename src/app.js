// importações
const app = require('./config/config')
const Catalogo = require('./models/Catalogo')
const User = require('./models/User')
const bcrypt = require('bcryptjs')
const passport = require('./config/auth')
const { eAdmin } = require('./helpers/eAdmin')
const { eRevendedora } = require('./helpers/eRevendedora')
const { temCatalogo } = require('./helpers/temCatalogo')
const revendedora = require('./routes/revendedora')
const admin = require('./routes/admin')
const Produto = require('./models/Produto')

// Sub Rotas

app.use('/revendedora', temCatalogo, revendedora)
app.use('/admin', eAdmin, admin)


// rotas GET
app.get('/', (req,res) => {
    res.render('home/index')
})

app.get('/login', (req, res) => {
    if(req.user){
        res.redirect('/revendedora')
    } else {
        res.render('home/login')
    }
})

app.get('/registrar', (req, res) => {
    res.render('home/registrar')
})

app.get('/registrar-catalogo', eRevendedora, (req,res) => {
    res.render('home/registrar-catalogo')
})

app.get('/logout', (req,res)=>{
    req.logout(()=>{
        req.flash('success_msg','Deslogado com sucesso')
        res.redirect('/')
    })
})

app.get('/:nomeCatalogo', (req,res) => {
    const nomeCatalogo = req.params.nomeCatalogo
    Catalogo.findOne({where:{nomeCatalogo}}).then((catalogo) => {
        Produto.findAll({where:{fk_id:catalogo.id}}).then((produtos) => {

            if(catalogo.status || req.user) {   
                res.locals.catalogo = catalogo.toJSON()
                res.locals.produtos = produtos.map(item => item.toJSON())
                res.render('home/catalogo', {layout:''})
            } else {
                res.render('home/semCatalogo', {layout:''})
            }

        }).catch((err) => {
            req.flash('error_msg', 'Erro ao buscar Produtos')
            res.redirect('/')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Erro ao buscar Catalogo')
        res.redirect('/')
    })
})

// Rotas POST
app.post('/login', (req,res,next)=>{
    passport.authenticate('local', {
        successRedirect:'/revendedora',
        failureRedirect:'/login',
        failureFlash:true
    })(req,res,next)
})

app.post('/registrar', (req,res)=>{
    // função que capitaliza as palavras
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    
    let nome = capitalize(req.body.nome.trim())
    let sobrenome = capitalize(req.body.sobrenome.trim())
    let email = req.body.email.trim().toLowerCase()
    let senha = req.body.senha.trim()
    let senha2 = req.body.senha2.trim()
    let eAdm
    
    // verificando os inputs
    let erros = []
    
    if(!nome) {
        erros.push({text:'Nome inválido'})
    }
    if(!sobrenome) {
        erros.push({text:'Sobrenome inválido'})
    }
    if(!email) {
        erros.push({text:'E-mail inválido'})
    }
    if(email == 'otaviosatago@gmail.com') {
        eAdm = true
    } else {
        eAdm = false
    }
    if(!senha) {
        erros.push({text:'Senha inválida'})
    }
    if(senha !== senha2) {
        erros.push({text:'Senhas não coincidem'})
    }
    if(nome.length < 2) {
        erros.push({text:'Nome muito curto'})
    }
    if(sobrenome.length < 2) {
        erros.push({text:'Sobrenome muito curto'})
    }
    if(senha.length < 8) {
        erros.push({text:'Senha muito curta'})
    }
    if(erros.length >= 1) {
        res.render('home/registrar', {erros})
    }else {
        User.findOne({where:{email:email}}).then((user)=>{
            if(user){
                req.flash('error_msg','E-mail já em uso')
                res.redirect('/registrar')
            } else {
                bcrypt.genSalt(10).then((salt)=>{
                    bcrypt.hash(senha,salt).then((senha)=>{
                        User.create({
                            nome:nome,
                            sobrenome:sobrenome,
                            email:email,
                            senha:senha,
                            eAdmin:eAdm
                        }).then(()=>{
                            req.flash('success_msg','Usúario criado com sucesso')
                            res.redirect('/login')
                        }).catch((err)=>{
                            console.log("Erro ao salvar a conta de um usúario no banco de dados, Erro:",err.message)
                            req.flash('error_msg','Erro interno, tente novamente mais tarde')
                            res.redirect('/registrar')
                        })
                    }).catch((err)=>{
                        console.log('Erro ao gerar o hash da senha no bcrypt, Erro:',err.message)
                        req.flash('error_msg','Erro interno, tente novamente mais tarde')
                        res.redirect('/registrar')
                    })
                }).catch((err)=>{
                    console.log('Erro ao gerar o salt da senha no bcrypt, Erro:',err.message)
                    req.flash('error_msg','Erro interno, tente novamente mais tarde')
                    res.redirect('/registrar')
                })
            }
        }).catch((err)=>{
            req.flash('error_msg','Não foi possivel verificar seu E-mail')
            console.log("Erro ao verificar o e-mail de um usúario no banco de dados, Erro:",err.message)
            res.redirect('/registrar')
        })
    }
})

app.post('/registrar-catalogo', eRevendedora, (req,res)=>{
    // função que capitaliza as palavras
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    
    let nomeCatalogo = req.body.nomeCatalogo.trim()
    let corFundo = req.body.corFundo
    let telefone = req.body.telefone.trim()
    telefone = telefone.replace(/[^\d]/g, '');
    let user = req.user.id

    // verificando os inputs
    let erros = []

    if(!nomeCatalogo) {
        erros.push({text:'Nome de Catalogo inválido'})
    }
    if(!corFundo) {
        erros.push({text:'Cor inválida'})
    }
    if(!telefone) {
        erros.push({text:'Telefone inválido'})
    }
    if(nomeCatalogo.length < 2) {
        erros.push({text:'Nome de Catalogo muito curto'})
    }
    if(telefone.length < 9) {
        erros.push({text:'telefone muito curto'})
    }
    if(erros.length >= 1) {
        res.render('home/registrar-catalogo', {erros})
    } else {
        Catalogo.findOne({where:{nomeCatalogo}}).then((catalogo)=>{
            if(catalogo){
                req.flash('error_msg','Nome de Catalogo já em uso')
                res.redirect('/registrar-catalogo')
            } else {
                Catalogo.create({
                    nomeCatalogo:nomeCatalogo,
                    telefone:telefone,
                    corFundo:corFundo,
                    fk_id:user
                }).then(()=>{
                    req.flash('success_msg','Catalogo criado com sucesso')
                    res.redirect('/revendedora')
                }).catch((err)=>{
                    console.log("Erro ao salvar o Catalogo no banco de dados, Erro:",err.message)
                    req.flash('error_msg','Erro interno, tente novamente mais tarde')
                    res.redirect('/registrar-catalogo')
                })
            }
        }).catch((err)=>{
            req.flash('error_msg','Não foi possivel verificar o Nome do Catalogo')
            console.log("Erro ao verificar o nome de Catalogo de um usúario no banco de dados, Erro:",err.message)
            res.redirect('/registrar-catalogo')
        })
    }
})



// outros
const PORT = 9090
app.listen(PORT,()=>{
    console.log(`Servidor rodando em: http://localhost:${PORT}`)
})