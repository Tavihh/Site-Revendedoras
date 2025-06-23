const path = require('path')
const multer = require('multer')
const fs = require('fs')

// config multer
const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        var pathFoto = path.join(__dirname,'../public/produtos')
        if(!fs.existsSync(pathFoto)) {
            fs.mkdirSync(pathFoto)
        }
        cb(null,pathFoto)
    },
    filename:(req,file,cb)=>{
        cb(null,new Date().getTime() + file.originalname)
    }
})

// exportação
module.exports = storage