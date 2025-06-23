// importações
const prompt = require('async-prompt')
const bcrypt = require('bcryptjs')
const User = require('./models/Users')
const Loja = require('./models/Loja')

setTimeout(async ()=> {

    console.log("====================")
    console.log("Cadastro da Loja")
    console.log("====================")
    
    // Válidação de Nome
    let nomeLoja = await prompt('Nome da loja: ')
    while (nomeLoja.length < 3) {
        console.log("Nome da loja é muito curto")
        nomeLoja = await prompt('Nome da loja: ')
    }
    
    // Válidação de Telefone
    let telefone = await prompt('Telefone whatsapp com DDD: ')
    while (telefone.length < 11) {
        console.log("Telefone muito curto")
        telefone = await prompt('Telefone whatsapp com DDD: ')
    }
    
    console.log("====================")
    console.log("Cadastro de Admin")
    console.log("====================")
    
    // Válidação de Nome
    let nome = await prompt('Seu nome: ')
    while (nome.length < 3) {
        console.log("Nome muito curto")
        nome = await prompt('Seu nome: ')
    }
    // Válidação de Sobrenome
    let sobrenome = await prompt('Seu sobrenome: ')
    while (sobrenome.length < 3) {
        console.log("Sobrenome muito curto")
        sobrenome = await prompt('Seu sobrenome: ')
    }
    // Válidação de Email
    let email = await prompt('Email: ')
    while (!email.includes('@') || !email.includes('.com')) {
        console.log("Email inválido!")
        email = await prompt('Email: ')
    }
    let senha = await prompt('Senha: ')
    let senha2 = await prompt('Comfirme a senha: ')
    
    while(senha != senha2) {
        console.log("Senhas não são iguais")
        senha = await prompt('Senha: ')
        senha2 = await prompt('Comfirme a senha: ')
    }

    console.log("====================")
    
    bcrypt.genSalt(10).then((salt)=>{
        bcrypt.hash(senha,salt).then((senha)=>{
            // Salvando os dados
            Promise.all([
                User.create({
                    nome:nome,
                    sobrenome:sobrenome,
                    email:email,
                    senha:senha
                }),
                Loja.create({
                    nome:nomeLoja,
                    telefone:telefone
                })
            ]).then(()=>{
                console.log('Loja criada com sucesso!')
                console.log('Usúario criado com sucesso!')
            // Tratando Erros
            }).catch((err)=>{
                console.log("Erro ao salvar a conta de um usúario no banco de dados, Erro:",err.message)
            })
        }).catch((err)=>{
            console.log('Erro ao gerar o hash da senha no bcrypt, Erro:',err.message)
        })
    }).catch((err)=>{
        console.log('Erro ao gerar o salt da senha no bcrypt, Erro:',err.message)
    })
}, 2000)
