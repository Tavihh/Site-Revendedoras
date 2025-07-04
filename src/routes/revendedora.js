const router = require('express').Router()
const Catalogo = require('../models/Catalogo')
const Produto = require('../models/Produto')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const storage = require('../config/multer')
const { Op } = require('sequelize');

// config upload
const upload = multer({storage:storage})

// rotas
router.get('/', (req,res) => {
    Catalogo.findOne({where:{fk_id:req.user.id}}).then((catalogo) => {
        Produto.findAll(({where:{fk_id:catalogo.id}})).then((produtos) => {
            res.locals.catalogo = catalogo.toJSON()
            res.locals.produtos = produtos.map(item => item.toJSON())
            res.render('revendedora/painel')
        }).catch((err) => {
            req.flash('error_msg', 'Erro ao buscar Produtos')
            console.log(err)
            res.redirect('/')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Erro ao buscar Catalogo')
        res.redirect('/')
    })
})

router.get('/edit-catalogo', (req,res) => {
    Catalogo.findOne({where:{fk_id:req.user.id}}).then((catalogo) => {

        res.locals.catalogo = catalogo.toJSON()
        res.render('revendedora/edit-catalogo')

    }).catch((err) => {
        req.flash('error_msg', 'Erro ao buscar Catalogo')
        res.redirect('/revendedora')
    })
})

router.get('/add-produto', (req,res) => {
    res.render('revendedora/add-produto')
})

router.get('/edit-produto/:id', (req,res) => {
    const id = req.params.id
    Produto.findOne(({where:{id}})).then((produto) => {
        res.locals.produto = produto.toJSON()
        res.render('revendedora/edit-produto')
    }).catch((err) => {
        req.flash('error_msg', 'Produto não existe!')
        res.redirect('/revendedora')
    })
})

router.get('/excluir-produto/:id', (req,res)=>{
    Produto.findOne({where:{id:req.params.id}}).then((produto)=>{
        if(produto){
            fs.promises.rm(path.join(__dirname,`../public/produtos/${produto.toJSON().path_foto}`),{force:true}).then(()=>{
                produto.destroy().then(()=>{
                    req.flash('success_msg','Produto deletado com sucesso')
                    res.redirect('/revendedora')
                }).catch((err)=>{
                    req.flash('error_msg','Não foi possivel excluir o produto')
                    res.redirect('/revendedora')
                })
            }).catch((err)=>{
                req.flash('error_msg','Erro ao apagar a foto')
                res.redirect('/revendedora')
            })
        } else {
            req.flash('error_msg','Produto não consta na base de dados')
            res.redirect('/revendedora')
        }
    }).catch((err)=>{
        req.flash('error_msg','Não foi possivel excluir o produto')
        console.log(err)
        res.redirect('/revendedora')
    })
})

// Rotas Post
router.post('/add-produto', (req, res) => {
    let erros = [];

    // Middleware para upload de arquivo
    upload.single('imagem')(req, res, (err) => {
        if (err) {
            req.flash('error_msg', 'Erro ao fazer upload da foto');
            return res.redirect('/revendedora/add-produto');
        }

        // Verifica se o arquivo foi enviado
        if (!req.file) {
            erros.push({ text: 'Nenhum arquivo enviado' });
        } else {
            // Verifica se o arquivo tem uma extensão válida
            const extensaoValida = ['.jpg', '.jpeg', '.png'];
            if (!extensaoValida.some(ext => req.file.filename.toLowerCase().endsWith(ext))) {
                erros.push({ text: 'Arquivo inválido. Apenas JPG e JPEG são permitidos' });
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
            return res.render('revendedora/add-produto', { erros });
        }
        Catalogo.findOne({where:{fk_id:req.user.id}}).then((catalogo)=>{
            if(catalogo){
                // Salva os dados no banco de dados
                Produto.create({
                    nome: req.body.nome.trim(),
                    preco: req.body.preco,
                    path_foto: req.file.filename,
                    link: req.body.link.trim(),
                    fk_id:catalogo.id,
                }).then(() => {
                    req.flash('success_msg', 'Produto salvo');
                    res.redirect('/revendedora/add-produto');
                }).catch((err) => {
                    // Remove o arquivo caso ocorra erro no banco
                    fs.unlink(req.file.path, (err) => {
                        if (err) {
                            console.error('Erro ao tentar remover a foto:', err);
                        }
                    });
                    console.log('Erro:',err)
                    req.flash('error_msg', 'Erro ao salvar o Produto');
                    res.redirect('/revendedora/add-produto');
                });

            } else {
                req.flash('error_msg','Não foi conseguir alguns dados')
                res.redirect('/revendedora/add-produto')
            }
        }).catch((err)=>{
            req.flash('error_msg','Erro ao fazer consulta no banco de dados')
            res.redirect('/revendedora/add-produto')
        })
    })
})

router.post('/edit-produto/:id', (req,res)=>{

    req.params.id
    Produto.findOne({where:{id:req.params.id}}).then((produto)=>{
        if(produto){
            produto.update({
                nome:req.body.nome.trim(),
                preco:req.body.preco,
                link:req.body.link.trim(),
            }).then(()=>{
                req.flash('success_msg','Atualizado com sucesso')
                res.redirect('/revendedora/')
            }).catch((err)=>{
                req.flash('error_msg','Não foi possivel atualizar os dados')
                res.redirect('/revendedora')
            })
        } else {
            req.flash('error_msg','Produto não encontrado')
            res.redirect('/revendedora')
        }
    }).catch((err)=>{
        req.flash('error_msg','Não foi possivel encontrar o produto')
        console.log(err)
        res.redirect('/revendedora')
    })
    
})

router.post('/edit-catalogo', (req, res) => {
    let nomeCatalogo = req.body.nomeCatalogo.trim();
    let corFundo = req.body.corFundo;
    let telefone = req.body.telefone.trim().replace(/[^\d]/g, '');

    let erros = [];

    // Validação
    if (!nomeCatalogo || nomeCatalogo.length < 2) {
        erros.push({ text: 'Nome de Catálogo inválido ou muito curto' });
    }
    if (!corFundo) {
        erros.push({ text: 'Cor inválida' });
    }
    if (!telefone || telefone.length < 9) {
        erros.push({ text: 'Telefone inválido ou muito curto' });
    }

    if (erros.length >= 1) {
        // Recarrega view com os erros e os dados atuais
        return Catalogo.findOne({ where: { fk_id: req.user.id } }).then((catalogo) => {
            if (!catalogo) {
                req.flash('error_msg', 'Não foi possível mostrar os erros');
                return res.redirect('/revendedora/edit-catalogo');
            }
            res.locals.catalogo = catalogo.toJSON();
            return res.render('revendedora/edit-catalogo', { erros });
        }).catch((err) => {
            console.error(err);
            req.flash('error_msg', 'Erro interno ao carregar catálogo');
            return res.redirect('/revendedora/edit-catalogo');
        });
    }

    // Verifica e atualiza
    Catalogo.findOne({ where: { fk_id: req.user.id } }).then((catalogoUser) => {
        if (!catalogoUser) {
            req.flash('error_msg', 'Catálogo não existe');
            return res.redirect('/revendedora/edit-catalogo');
        }

        // Verifica se nome foi alterado e já existe em outro catálogo
        if (catalogoUser.nomeCatalogo !== nomeCatalogo) {
            Catalogo.findOne({
                where: {
                    nomeCatalogo,
                    fk_id: { [Op.ne]: req.user.id } // diferente do atual user
                }
            }).then((catalogoExistente) => {
                if (catalogoExistente) {
                    req.flash('error_msg', 'Nome de Catálogo já em uso. Escolha outro.');
                    return res.redirect('/revendedora/edit-catalogo');
                }

                // Atualiza
                return catalogoUser.update({
                    nomeCatalogo,
                    corFundo,
                    telefone
                }).then(() => {
                    req.flash('success_msg', 'Catálogo atualizado com sucesso!');
                    return res.redirect('/revendedora');
                }).catch((err) => {
                    console.error(err);
                    req.flash('error_msg', 'Erro ao atualizar o catálogo.');
                    return res.redirect('/revendedora/edit-catalogo');
                });
            }).catch((err) => {
                console.error(err);
                req.flash('error_msg', 'Erro ao verificar nome duplicado');
                return res.redirect('/revendedora/edit-catalogo');
            });

        } else {
            // Nome não foi alterado, só atualiza direto
            return catalogoUser.update({
                nomeCatalogo,
                corFundo,
                telefone
            }).then(() => {
                req.flash('success_msg', 'Catálogo atualizado com sucesso!');
                return res.redirect('/revendedora');
            }).catch((err) => {
                console.error(err);
                req.flash('error_msg', 'Erro ao atualizar o catálogo.');
                return res.redirect('/revendedora/edit-catalogo');
            });
        }
    }).catch((err) => {
        console.error(err);
        req.flash('error_msg', 'Erro ao buscar catálogo.');
        return res.redirect('/revendedora/edit-catalogo');
    });
});


module.exports = router