// importações
const router = require('express').Router()
const Produto = require('../models/Produto')
const Loja = require('../models/Loja')
const bcrypt = require('bcryptjs')
const { Op } = require('sequelize')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const storage = require('../config/multer')

// config upload
const upload = multer({storage:storage})

// rotas GET
router.get('/', (req,res) => {
    // buscando os produtos
    Produto.findAll({where:{fk_id:req.user.id},order:[['createdAt','desc']]}).then((produto)=>{
        produto = produto.map(item => {
            item = item.toJSON()
            item.preco = item.preco.toFixed(2)
            return item
        })
        produto.total = produto.length
        res.render('admin/painel', {layout:'admin',produto})
    // tratando o erro
    }).catch((err)=>{
        req.flash('error_msg','Erro ao carregar o painel')
        res.redirect('/login')
    })
})

router.get('/produto/add', (req,res)=>{
    res.render('admin/addProduto', {layout:'admin'})
})

router.get('/editar', (req,res)=>{
    Loja.findOne({where:{id:req.user.id}}).then((loja) => {
        if(loja) {
            loja = loja.toJSON()
            res.locals.layout = 'admin';
            res.render('admin/editLoja', {layout:'admin',loja})
        } else {
            req.flash('error_msg','Loja não encontrada')
            res.redirect('/admin')
        }
    }).catch((err)=>{
        console.log(err)
        req.flash('error_msg','Não foi possivel fazer a busca no banco de dados')
        res.redirect('/admin')
    })
})

router.get('/produto/editar/:id',(req,res)=>{
    Produto.findOne({where:{id:req.params.id, fk_id:req.user.id}}) .then((produto)=>{
        if(produto){
            produto = produto.toJSON()
            produto.preco = produto.preco.toFixed(2)
            res.render('admin/editProduto', {layout:'admin',produto})
        } else{
            req.flash('error_msg','Produto não encontrado')
            res.redirect('/admin')
        }
    }).catch((err)=>{
        req.flash('error_msg','Produto não encontrado')
        res.redirect('/admin')
    })
})

router.get('/produto/del/:id', (req,res)=>{
    Produto.findOne({where:{id:req.params.id,fk_id:req.user.id}}).then((produto)=>{
        if(produto){
            res.render('admin/confirmDel', {layout:'admin',produto:produto.toJSON()})
        } else {
            req.flash('error_msg','Produto não encontrado')
            res.redirect('/admin/')
        }
    }).catch((err)=>{
        req.flash('error_msg','Não foi possivel encontrar o produto')
        res.redirect('/admin')
    })
})


// rotas POST
router.post('/pesquisa', (req,res)=>{
    Produto.findAll({where:{nome:{[Op.like]: `%${req.body.psq}%`}},order:[['createdAt','desc']],limit:20}).then((produto)=>{
        produto = produto.map(item => item.toJSON())
        res.render('admin/painel',{layout:'admin',produto})
    }).catch((err)=>{
        res.status(404).send('Ocorreu um erro ao carregar os produtos, tente novamente')
    })
})

router.post('/produto/add', (req, res) => {
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
            return res.render('admin/addProduto', { erros });
        }
        Loja.findOne({where:{id:req.user.id}}).then((loja)=>{
            if(loja){
                // Salva os dados no banco de dados
                Produto.create({
                    nome: req.body.nome.trim(),
                    preco: req.body.preco,
                    path_foto: req.file.filename,
                    link: req.body.link.trim(),
                    fk_id: req.user.id,
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

router.post('/produto/editar/:id', (req,res)=>{
    Produto.findOne({where:{id:req.params.id, fk_id:req.user.id}}).then((produto)=>{
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

router.post('/produto/confirmDel', (req,res)=>{
    Produto.findOne({where:{id:req.body.id, fk_id:req.user.id}}).then((produto)=>{
        if(produto){
            fs.promises.rm(path.join(__dirname,`../public/produtos/${produto.toJSON().path_foto}`),{force:true}).then(()=>{
                produto.destroy().then(()=>{
                    req.flash('success_msg','Produto deletado com sucesso')
                    res.redirect('/admin')
                }).catch((err)=>{
                    req.flash('error_msg','Não foi possivel excluir o produto')
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
        req.flash('error_msg','Não foi possivel excluir o produto')
        console.log(err)
        res.redirect('/admin')
    })
})

router.post('/editar', (req,res) => {
    // função que capitaliza as palavras
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    let nomeLoja = capitalize(req.body.nomeLoja.trim())
    let nome = capitalize(req.body.nome.trim())
    let sobrenome = capitalize(req.body.sobrenome.trim())
    let telefone = req.body.telefone.trim()
    telefone = telefone.replace(/[^\d]/g, ''); 

    // verificando os inputs
    let erros = []

    if(!nomeLoja) {
        erros.push({texto:'Nome de Loja inválido'})
    }
    if(!nome) {
        erros.push({texto:'Nome inválido'})
    }
    if(!sobrenome) {
        erros.push({texto:'Sobrenome inválido'})
    }
    if(!telefone) {
        erros.push({texto:'Telefone inválido'})
    }
    if(nomeLoja.length < 2) {
        erros.push({texto:'Nome de Loja muito curto'})
    }
    if(nome.length < 2) {
        erros.push({texto:'Nome muito curto'})
    }
    if(sobrenome.length < 2) {
        erros.push({texto:'Sobrenome muito curto'})
    }
    if(telefone.length < 9) {
        erros.push({texto:'telefone muito curto'})
    }
    if(erros.length >= 1) {
        res.render('admin/editLoja', {layout:'admin',erros})
    } else {
        Loja.update({
            nomeLoja:nomeLoja,
            nome:nome,
            sobrenome:sobrenome,
            telefone:telefone,

        },{where:{id:req.user.id}}).then(()=>{
            req.flash('success_msg','Loja Atualizada com sucesso!')
            res.redirect('/admin')
        }).catch((err)=>{
            console.log("Erro ao salvar a conta de um usúario no banco de dados, Erro:",err.message)
            req.flash('error_msg','Erro interno, tente novamente mais tarde')
            res.redirect('/admin/editar')
        })

    }
})

router.post('/atualizarSenha', (req,res) => {
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
        res.render('admin/editLoja', {layout:'admin',erros})
    } else {
        // buscando senha da loja
        Loja.findOne({where:{id:req.user.id}}).then((loja)=>{
            if(loja){
                bcrypt.compare(senha, req.user.senha).then((equal) => {
                    if (equal) {
                        // criptografando senha
                        bcrypt.genSalt(10).then((salt)=>{
                            bcrypt.hash(newsenha,salt).then((hashsenha)=>{
                                // salvando senha
                                loja.update({
                                    senha:hashsenha
                                },{where:{id:req.user.id}}).then(()=>{
                                    // retornando a página de edição com senha atualizada
                                    req.flash('success_msg','Senha atualizada com sucesso')
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



// exportação
module.exports = router