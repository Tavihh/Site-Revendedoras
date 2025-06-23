// importações
const app = require('./config/config')
const admin = require('./routes/admin')
const home = require('./routes/home')

// rotas
app.use('/admin', (req,res,next)=>{
    res.locals.layout = 'admin';
    next()
},admin)

app.use('/', home)

// outros
const PORT = 9090
app.listen(PORT,()=>{
    console.log(`Servidor rodando em: http://localhost:${PORT}`)
})