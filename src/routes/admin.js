// importações
const router = require('express').Router()
const bcrypt = require('bcryptjs')
const User = require('../models/Users')
const Produto = require('../models/Produto')
const { eAdmin } = require('../helpers/eAdmin')
const { Op } = require('sequelize')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const storage = require('../config/multer')
const Loja = require('../models/Loja')

// config upload
const upload = multer({storage:storage})

// rotas GET
router.get('/', eAdmin, (req,res)=>{
    // buscando os produtos
    Produto.findAll({order:[['createdAt','desc']]}).then((produto)=>{
        produto = produto.map(item => {
            item = item.toJSON()
            item.preco = item.preco.toFixed(2)
            return item
        })
        produto.total = produto.length
        res.render('admin/index', {produto})
    // tratando o erro
    }).catch((err)=>{
        req.flash('error_msg','Erro ao carregar o painel')
        res.redirect('/')
    })
})

router.get('/editar', eAdmin, (req,res)=>{
    Promise.all([
        User.findOne({where:{id:req.user.id}}),
        Loja.findOne()
    ]).then(([user,loja]) => {
        if(user) {
            user = user.toJSON()
            loja = loja.toJSON()
            res.render('admin//edit/editADM', {user,loja})
        } else {
            req.flash('error_msg','Adiministrador não encontrado')
            res.redirect('/admin')
        }
    }).catch((err)=>{
        console.log(err)
        req.flash('error_msg','Não foi possivel fazer a busca no banco de dados')
        res.redirect('/admin')
    })
})

router.get('/produto/add', eAdmin, (req,res)=>{
    res.render('admin/add/addProduto')

})

router.get('/produto/editar/:id', eAdmin, (req,res)=>{
    Produto.findOne({where:{id:req.params.id}}) .then((produto)=>{
        if(produto){
            produto = produto.toJSON()
            produto.preco = produto.preco.toFixed(2)
            res.render('admin/edit/editProduto', {produto})
        } else{
            req.flash('error_msg','Produto não encontrado')
            res.redirect('/')
        }
    }).catch((err)=>{
        req.flash('error_msg','Produto não encontrado')
        res.redirect('/')
    })
})

router.get('/produto/del/:id', eAdmin,(req,res)=>{

    Produto.findOne({where:{id:req.params.id}}).then((produto)=>{
        if(produto){
            res.render('admin/confirmDel', {produto:produto.toJSON()})
        } else {
            req.flash('error_msg','Produto não encontrado')
            res.redirect('/admin')
        }
    }).catch((err)=>{
        req.flash('error_msg','Não foi possivel encontrar o produto')
        res.redirect('/admin')
    })
})

router.get('/cadastrar' , eAdmin, (req, res)=>{
    res.render('admin/add/cadastrar')
})

router.get('/logout', (req,res)=>{
    req.logout(()=>{
        req.flash('success_msg','Deslogado com sucesso')
        res.redirect('/')
    })
})

// rotas POST
router.post('/pesquisa', eAdmin, (req,res)=>{
    Produto.findAll({where:{nome:{[Op.like]: `%${req.body.psq}%`}},order:[['createdAt','desc']],limit:20}).then((produto)=>{
        produto = produto.map(item => item.toJSON())
        res.render('admin/index',{produto})
    }).catch((err)=>{
        res.status(404).send('Ocorreu um erro ao carregar os produtos, tente novamente')
    })
})

router.post('/editarLoja', eAdmin, (req,res)=>{
    Loja.findOne().then((loja)=>{
        if(loja){
            telefone = req.body.telefone
            // Remove todos os caracteres não numéricos (incluindo parênteses, hífens e espaços)
            telefone = telefone.replace(/[^\d]/g, ''); 
            loja.update({
                nome:req.body.nome,
                telefone:telefone,
            }).then(()=>{
                req.flash('success_msg','Loja atualizada com sucesso!')
                res.redirect('/admin')
            }).catch((err)=>{
                req.flash('error_msg','erro ao atualizar dados')
                res.redirect('/admin')
            })
        } else {
            req.flash('error_msg','Loja não encontrada')
            res.redirect('/admin')
        }
    }).catch((err)=>{
        req.flash('error_msg','Não foi possivel fazer a busca no banco de dados')
        res.redirect('/admin')
    })
})

router.post('/editar/:id', eAdmin, (req,res)=>{
    User.findOne({where:{id:req.params.id}}).then((user)=>{
        if(user){
            user.update({
                nome:req.body.nome,
                sobrenome:req.body.sobrenome,
                email:req.body.email
            }).then(()=>{
                req.flash('success_msg','Administrador atualizado com sucesso!')
                res.redirect('/admin')
            }).catch((err)=>{
                req.flash('error_msg','erro ao atualizar dados')
                res.redirect('/admin')
            })
        } else {
            req.flash('error_msg','Adiministrador não encontrado')
            res.redirect('/admin')
        }
    }).catch((err)=>{
        req.flash('error_msg','Não foi possivel fazer a busca no banco de dados')
        res.redirect('/admin')
    })
})

router.post('/atualizarSenha', eAdmin, (req,res) => {
    let senha = req.body.senha.trim()
    let newsenha = req.body.newsenha.trim()
    let newsenha2 = req.body.newsenha2.trim()

    // verificando os inputs
    let erros = []

    if(!senha) {
        erros.push({texto:'Senha inválida'})
    }
    if(!newsenha) {
        erros.push({texto:'Senha inválida'})
    }
    if(!newsenha2) {
        erros.push({texto:'Senha inválida'})
    }
    if(newsenha !== newsenha2) {
        erros.push({texto:'Nova senha digitada errada em um dos campos'})
    }
    if(newsenha.length < 8) {
        erros.push({texto:'Nova Senha muito curta'})
    }
    // retornando os erros
    if(erros.length >= 1) {
        res.render('admin/edit/editADM', {erros})
    } else {
        // verificando se email já existe
        User.findOne({where:{id:req.user.id}}).then((user)=>{
            if(user){
                bcrypt.compare(senha, req.user.senha).then((equal) => {
                    if (equal) {
                        // criptografando senha
                        bcrypt.genSalt(10).then((salt)=>{
                            bcrypt.hash(newsenha,salt).then((hashsenha)=>{
                                // salvando usúario
                                User.update({
                                    senha:hashsenha
                                },{where:{id:req.user.id}}).then(()=>{
                                    // retornando a página de login com novo usúario cadastrado
                                    req.flash('success_msg','Usúario atualizado com sucesso')
                                    res.redirect('/admin/editar')
                                    // tratando erros
                                }).catch((err) => {
                                    console.log("Erro ao atualizar a senha de um usúario no banco de dados, Erro:",err.message)
                                    req.flash('error_msg','Erro interno, tente novamente mais tarde')
                                    res.redirect('/admin/editar')
                                })
                            }).catch((err) => {
                                console.log('Erro ao gerar o hash da senha no bcrypt, Erro:',err.message)
                                req.flash('error_msg','Erro interno, tente novamente mais tarde')
                                res.redirect('/admin/editar')
                            })
                        }).catch((err) => {
                            console.log('Erro ao gerar o salt da senha no bcrypt, Erro:',err.message)
                            req.flash('error_msg','Erro interno, tente novamente mais tarde')
                            res.redirect('/admin/editar')
                        })
                    } else {
                        req.flash('error_msg','Senha atual não consta no banco de dados')
                        res.redirect('/admin/editar')
                    }
                }).catch((err) => {
                    req.flash('error_msg','Não foi possivel comparar sua senha')
                    res.redirect('/admin/editar')
                })
            } else {
                req.flash('error_msg','Não foi possivel encontrar seu usúario')
                res.redirect('/admin/editar')
            }
        }).catch((err) => {
            req.flash('error_msg','Não foi possivel verificar sua conta')
            console.log("erro ao verificar a conta de um usúario no banco de dados, Erro:",err.message)
            res.redirect('/admin/editar')
        })
    }
})

router.post('/produto/add', eAdmin, (req, res) => {
    let erros = [];

    // Middleware para upload de arquivo
    upload.single('foto')(req, res, (err) => {
        if (err) {
            req.flash('error_msg', 'Erro ao fazer upload da foto');
            return res.redirect('/admin/produto/add');
        }

        // Verifica se o arquivo foi enviado
        if (!req.file) {
            erros.push({ texto: 'Nenhum arquivo enviado' });
        } else {
            // Verifica se o arquivo tem uma extensão válida
            const extensaoValida = ['.jpg', '.jpeg'];
            if (!extensaoValida.some(ext => req.file.filename.toLowerCase().endsWith(ext))) {
                erros.push({ texto: 'Arquivo inválido. Apenas JPG e JPEG são permitidos' });
                // Remove o arquivo caso a extensão seja inválida
                fs.unlink(req.file.path, (err) => {
                    if (err) {
                        console.error('Erro ao tentar remover a foto:', err);
                    }
                });
            }
        }

        // Se houver erros, renderiza a página novamente
        if (erros.length > 0) {
            return res.render('admin/add/addProduto', { erros });
        }
        Loja.findOne().then((loja)=>{
            if(loja){
                // Salva os dados no banco de dados
                Produto.create({
                    nome: req.body.nome.trim(),
                    preco: req.body.preco,
                    path_foto: req.file.filename,
                    link: req.body.link.trim(),
                    fk_telefone: loja.telefone,
                }).then(() => {
                    req.flash('success_msg', 'Produto salvo');
                    res.redirect('/admin');
                }).catch((err) => {
                    // Remove o arquivo caso ocorra erro no banco
                    fs.unlink(req.file.path, (err) => {
                        if (err) {
                            console.error('Erro ao tentar remover a foto:', err);
                        }
                    });
                    console.log('Erro:',err)
                    req.flash('error_msg', 'Erro ao salvar o Produto');
                    res.redirect('/admin/produto/add');
                });

            } else {
                req.flash('error_msg','Não foi conseguir alguns dados')
                res.redirect('/admin/produto/add')
            }
        }).catch((err)=>{
            req.flash('error_msg','Erro ao fazer consulta no banco de dados')
            res.redirect('/admin/produto/add')
        })
    })
})

router.post('/produto/editar/:id', eAdmin, (req,res)=>{
    Produto.findOne({where:{id:req.params.id}}).then((produto)=>{
        if(produto){
            produto.update({
                nome:req.body.nome.trim(),
                preco:req.body.preco,
                link:req.body.link.trim(),
            }).then(()=>{
                req.flash('success_msg','Atualizado com sucesso')
                res.redirect('/admin')
            }).catch((err)=>{
                req.flash('error_msg','Não foi possivel atualizar os dados')
                res.redirect('/admin')
            })
        } else {
            req.flash('error_msg','Produto não encontrado')
            res.redirect('/admin')
        }
    }).catch((err)=>{
        req.flash('error_msg','Não foi possivel encontrar o produto')
        res.redirect('/admin')
    })
    
})

router.post('/produto/confirmDel', eAdmin, (req,res)=>{
    Produto.findOne({where:{id:req.body.id}}).then((produto)=>{
        if(produto){
            fs.promises.rm(path.join(__dirname,`../public/produtos/${produto.toJSON().path_foto}`),{force:true}).then(()=>{
                produto.destroy().then(()=>{
                    req.flash('success_msg','Produto deletado com sucesso')
                    res.redirect('/admin')
                }).catch((err)=>{
                    req.flash('error_msg','Não foi possivel excluir o produto 2')
                    res.redirect('/admin')
                })
            }).catch((err)=>{
                req.flash('error_msg','Erro ao apagar a foto')
                res.redirect('/admin')
            })
        } else {
            req.flash('error_msg','Produto não consta na base de dados')
            res.redirect('/admin')
        }
    }).catch((err)=>{
        req.flash('error_msg','Não foi possivel excluir o produto 1')
        res.redirect('/admin')
    })
})

router.post('/cadastrar', eAdmin, (req,res)=>{
    // função que capitaliza as palavras
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    
    let nome = capitalize(req.body.nome.trim())
    let sobrenome = capitalize(req.body.sobrenome.trim())
    let email = req.body.email.trim().toLowerCase()
    let telefone = req.body.telefone.trim()
    telefone = telefone.replace(/[^\d]/g, ''); 
    let senha = req.body.senha.trim()
    let senha2 = req.body.senha2.trim()
    
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
    if(!telefone) {
        erros.push({text:'Telefone inválido'})
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
    if(telefone.length < 9) {
        erros.push({text:'telefone muito curto'})
    }
    if(senha.length < 8) {
        erros.push({text:'Senha muito curta'})
    }

    if(erros.length >= 1) {
        res.render('/admin/add/cadastrar', {erros})
    } else {
        User.findOne({where:{email:email}}).then((user)=>{
            if(user){
                req.flash('error_msg','E-mail já em uso')
                res.redirect('/admin/cadastrar')
            } else {
                bcrypt.genSalt(10).then((salt)=>{
                    bcrypt.hash(senha,salt).then((senha)=>{
                        User.create({
                            nome:nome,
                            sobrenome:sobrenome,
                            telefone:telefone,
                            email:email,
                            senha:senha
                        }).then(()=>{
                            req.flash('success_msg','Usúario criado com sucesso')
                            res.redirect('/admin/cadastrar')
                        }).catch((err)=>{
                            console.log("Erro ao salvar a conta de um usúario no banco de dados, Erro:",err.message)
                            req.flash('error_msg','Erro interno, tente novamente mais tarde')
                            res.redirect('/admin/cadastrar')
                        })
                    }).catch((err)=>{
                        console.log('Erro ao gerar o hash da senha no bcrypt, Erro:',err.message)
                        req.flash('error_msg','Erro interno, tente novamente mais tarde')
                        res.redirect('/admin/cadastrar')
                    })
                }).catch((err)=>{
                    console.log('Erro ao gerar o salt da senha no bcrypt, Erro:',err.message)
                    req.flash('error_msg','Erro interno, tente novamente mais tarde')
                    res.redirect('/admin/cadastrar')
                })
            }
        }).catch((err)=>{
            req.flash('error_msg','Não foi possivel verificar seu E-mail')
            console.log("erro ao verificar o e-mail de um usúario no banco de dados, Erro:",err.message)
            res.redirect('/admin/cadastrar')
        })
    }
})

// exportações
module.exports = router