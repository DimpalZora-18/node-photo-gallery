require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const Photo = require('./models/photo.js');
const login = require('./models/model.js');
const multer = require('multer');
const path = require('path');
const methodOverride = require('method-override');
const session = require('express-session');
const cookie = require('cookie-parser');
const mongoStore = require('connect-mongo');
const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());
app.use(cookie());

app.set('view engine','ejs');
app.use(express.urlencoded({extended : true}));
app.use(methodOverride('_method'));
app.use('/uploads', express.static('uploads'));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave : false,
    saveUninitialized: false,
    store : mongoStore.create({mongoUrl:process.env.MONGO_URL})
}));

//function so that we can not able to aceess any other page
function requireLogin(req,res,next){
    if(!req.session.userId){
        return res.redirect("/signup");
    }
    next();
}


const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });


//Mongo Db Connection
mongoose.connect(process.env.MONGO_URL)
.then(()=>{
    console.log("mongodb connected");
})
.catch((err)=>{
    console.log("error connecting to mongodb",err);
})

app.get('/',(req,res)=>{
   res.render('auth/signup');
});

app.get('/photos',requireLogin,async(req,res) =>{
   const photos = await Photo.find({});
   res.render('photos/index',{photos});
});

app.get('/photos/new',requireLogin,async(req,res) =>{
    res.render('photos/new',{photo :{}});
});

app.post('/photos',upload.single('photo'),async(req,res)=>{
    const {title} = req.body;

    await Photo.create({
        title:title,
        filename:req.file.filename,
        filepath:req.file.path
    });
    
    res.redirect('/photos');
});

app.get('/photos/:id/edit',requireLogin,async(req,res) =>{
    const photo = await Photo.findById(req.params.id);
    res.render('photos/edit',{photo});
});

app.put('/photos/:id',upload.single("photo"),async(req,res) =>{
    const {title} = req.body;
    await Photo.findByIdAndUpdate(req.params.id,{title});
    res.redirect('/photos');
});

app.delete('/photos/:id',async(req,res) =>{
    await Photo.findByIdAndDelete(req.params.id);
    res.redirect('/photos');
});
app.get('/signup',(req,res)=>{
    res.render('auth/signup');
});
app.post('/signup',async(req,res)=>{
    try{
    const {email,password} = req.body;
    const existingUser = await login.findOne({email,password});

    if(existingUser){
        return res.send("User already exists.Please login.");
    }

    await login.create({email, password });
    res.redirect("/login");
    }catch(err){
        return res.redirect("/signup");
    }
});

app.get('/login',(req,res)=>{
    res.render('auth/login');
});

app.post('/login',async(req,res)=>{
    const {email,password} = req.body;
    const user = await login.findOne({email});
    if(!user){
      return res.redirect("/signup");
    }
    if(user.password !== password){
        return res.redirect("/signup");
    }
    req.session.userId = user._id;
    res.redirect('/photos');
});
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid'); 
    res.redirect('/login');
  });
});


//port connection
app.listen(port,()=>{
    console.log(`server is running on port :${port}`);
})
