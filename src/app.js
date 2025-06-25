// importações
const app = require('./config/config')
const Admin = require('./routes/admin')
const loja = require('./routes/loja')
const Loja = require('./models/Loja')
const bcrypt = require('bcryptjs')
const passport = require('./config/auth')
const { eAdmin } = require('./helpers/eAdmin')

// Sub Rotas
app.use('/admin', eAdmin, Admin)
app.use('/loja', loja)

// rotas GET
app.get('/', (req,res) => {
    res.render('home/home')
})

app.get('/login', (req, res) => {
    if(req.user){
        res.redirect('/admin')
    } else {
        res.render('home/login')
    }
})

app.get('/cadastrar', (req, res) => {
    res.render('home/cadastrar')
})

app.get('/logout', (req,res)=>{
    req.logout(()=>{
        req.flash('success_msg','Deslogado com sucesso')
        res.redirect('/')
    })
})

// Rotas POST
app.post('/login', (req,res,next)=>{
    passport.authenticate('local', {
        successRedirect:'/admin',
        failureRedirect:'/login',
        failureFlash:true
    })(req,res,next)
})

app.post('/cadastrar', (req,res)=>{
    // função que capitaliza as palavras
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    
    let nomeLoja = capitalize(req.body.nomeLoja.trim())
    let nome = capitalize(req.body.nome.trim())
    let sobrenome = capitalize(req.body.sobrenome.trim())
    let email = req.body.email.trim().toLowerCase()
    let telefone = req.body.telefone.trim()
    telefone = telefone.replace(/[^\d]/g, ''); 
    let senha = req.body.senha.trim()
    let senha2 = req.body.senha2.trim()
    
    // verificando os inputs
    let erros = []
    
    if(!nomeLoja) {
        erros.push({text:'Nome de Loja inválido'})
    }
    if(!nome) {
        erros.push({text:'Nome inválido'})
    }
    if(!sobrenome) {
        erros.push({text:'Sobrenome inválido'})
    }
    if(!email) {
        erros.push({text:'E-mail inválido'})
    }
    if(!telefone) {
        erros.push({text:'Telefone inválido'})
    }
    if(!senha) {
        erros.push({text:'Senha inválida'})
    }
    if(senha !== senha2) {
        erros.push({text:'Senhas não coincidem'})
    }
    if(nomeLoja.length < 2) {
        erros.push({text:'Nome de Loja muito curto'})
    }
    if(nome.length < 2) {
        erros.push({text:'Nome muito curto'})
    }
    if(sobrenome.length < 2) {
        erros.push({text:'Sobrenome muito curto'})
    }
    if(telefone.length < 9) {
        erros.push({text:'telefone muito curto'})
    }
    if(senha.length < 8) {
        erros.push({text:'Senha muito curta'})
    }

    if(erros.length >= 1) {
        res.render('/cadastrar', {erros})
        console.log(erros)
    } else {
        Loja.findOne({where:{email:email}}).then((loja)=>{
            if(loja){
                req.flash('error_msg','E-mail já em uso')
                res.redirect('/cadastrar')
            } else {
                bcrypt.genSalt(10).then((salt)=>{
                    bcrypt.hash(senha,salt).then((senha)=>{
                        Loja.create({
                            nomeLoja:nomeLoja,
                            nome:nome,
                            sobrenome:sobrenome,
                            telefone:telefone,
                            email:email,
                            senha:senha
                        }).then(()=>{
                            req.flash('success_msg','Usúario criado com sucesso')
                            res.redirect('/login')
                        }).catch((err)=>{
                            console.log("Erro ao salvar a conta de um usúario no banco de dados, Erro:",err.message)
                            req.flash('error_msg','Erro interno, tente novamente mais tarde')
                            res.redirect('/cadastrar')
                        })
                    }).catch((err)=>{
                        console.log('Erro ao gerar o hash da senha no bcrypt, Erro:',err.message)
                        req.flash('error_msg','Erro interno, tente novamente mais tarde')
                        res.redirect('/cadastrar')
                    })
                }).catch((err)=>{
                    console.log('Erro ao gerar o salt da senha no bcrypt, Erro:',err.message)
                    req.flash('error_msg','Erro interno, tente novamente mais tarde')
                    res.redirect('/cadastrar')
                })
            }
        }).catch((err)=>{
            req.flash('error_msg','Não foi possivel verificar seu E-mail')
            console.log("erro ao verificar o e-mail de um usúario no banco de dados, Erro:",err.message)
            res.redirect('/cadastrar')
        })
    }
})

// outros
const PORT = 9090
app.listen(PORT,()=>{
    console.log(`Servidor rodando em: http://localhost:${PORT}`)
})