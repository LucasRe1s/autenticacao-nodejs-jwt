/* imports */
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

// config Json response
app.use(express.json());

//Models

const User = require('./models/User');

/* open route - public */
app.get('/', (req, res) => {
    res.status(200).json({ msg: 'Welcome to API!'});
});

//private route
app.get('/user/:id', checkToken, async (req, res) => {
    const id = req.params.id;

    //check if user exists
    const user = await User.findById(id, '-password');

    if(!user){
        return res.status(404).json({ msg: 'Usuario não encontrado'});
    }
    res.status(200).json({ user});
});

function checkToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    
    if(!token){
        return res.status(401).json({ msg: 'Acesso negado!'});
        
    }

    try {
        const secret = process.env.SECRET;
        jwt.verify(token, secret);
        next()

    } catch (error) {
        res.status(400).json({ msg: 'Token invalido!'});
    }

}

// register users

app.post('/auth/register', async(req, res) => {

    const {name, email, password, confirmpassword} = req.body;

    // validations
    if(!name){
        return res.status(422).json({msg: 'O nome é obrigatório!'});
    }

    if(!email){
        return res.status(422).json({msg: 'O email é obrigatório!'});
    }

    if(!password){
        return res.status(422).json({msg: 'A senha é obrigatório!'});
    }

    if(password !== confirmpassword){
        return res.status(422).json({msg: 'As senhas não conferem"'});
    }

    //check if users exists
    const userExists = await User.findOne({ email: email});

    if(userExists){
        return res.status(422).json({ msg: 'Por favor, utilize outro e-mail"'});
    }

    // create password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    //create user
    const user = new User({
        name, 
        email, 
        password: passwordHash,
    });

    try{

        await user.save()

        res.status(201).json({msg: 'Usuario criado com sucesso!'})

    }catch(error){
        console.log(500)
        res.status(500).json({msg: 'Aconteceu um erro no servidor, tente novamente mais tarde.'})
    }

});

//login

app.post('/auth/login', async (req, res) => {
    const {email, password} = req.body;

    //validations
    if(!email){
        return res.status(422).json({msg: 'O email é obrigatório!'});
    }

    if(!password){
        return res.status(422).json({msg: 'A senha é obrigatório!'});
    }

    // check if user exists

    const user = await User.findOne({ email: email});

    if(!user){
        return res.status(404).json({ msg: 'Usuario não encontrado!'});
    }

    //check if password match
    const checkPassword = await bcrypt.compare(password, user.password);

    if(!checkPassword){
        return res.status(422).json({msg: 'Senha invalida'})
    }

    try {
        const secret = process.env.SECRET;

        const token = jwt.sign(
            {
                id: user._id,
            },
            secret,
        )
        
        res.status(200).json({msg: "Autenticão realizada com sucesso!", token})
        
    } catch (err) {
        console.log(error)
        res.status(500).json({msg: 'Aconteceu um erro no servidor, tente novamente mais tarde.'})
    }
})

// credencials

const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;

mongoose
.connect(
    `mongodb+srv://${dbUser}:${dbPass}@cluster0.4i5znht.mongodb.net/?retryWrites=true&w=majority`
    )
.then(() => {
    app.listen(3000);
    console.log("Conectou ao banco!")
})
.catch((err)=> console.log(err));

/* porta */
