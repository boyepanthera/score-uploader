import express from 'express';
import multer from 'multer';
import xlstojson from 'xls-to-json-lc';
import xlsxtojson from 'xlsx-to-json-lc';
import mongoose from 'mongoose';
import Students from './models/Students';
import methodOverride from 'method-override';
const app = express();
const port = 9090|| process.env.PORT;
const ip = '127.0.0.1' || process.env.IP;
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));

const url ='mongodb://localhost:27017/excel-parser';

mongoose.connect (url, {useNewUrlParser:true}, (err, connected) => {
    try {
        console.log(`your app has connected to the local database served on ${url}`)
    } catch (err) {
        console.log(err);
    } 
});

// Globally scoped variables
var exceltojson = require('xls-to-json-lc');
var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        const datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1]);
    }
});

// configuring multer for storage, and file verification before upload
const upload = multer({ //multer settings
    storage: storage,
    fileFilter: function (req, file, callback) { //file filtering method in multer
        if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {
            return callback(new Error(`Wrong file extension type, upload either xls or xlsx to continue`));
        }
        callback(null, true);
    }
}).single('file');

// homepage API endpoint
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/scoresheet', (req, res) => {
    Students.find({}, (err, students) => {
        try {
            res.render('scoresheet', {students});
        }
        catch (err) {
            console.error(err);
        }
    });
});

// API endpoint for excel file upload
app.post('/scoresheet', (req, res) =>{
    upload(req, res,  (err)=> {
        if (err) { 
            res.status(400).json({ error_code: 1, err_desc: err });
            return;
        } 
        if(!req.file) {
            res.status(400).json({ error_code: 0, err_desc: "no file attached" });
        }
        if (req.file.originalname.split('.')[req.file.originalname.split('.').length - 1] === 'xlsx') {
            exceltojson = xlsxtojson;
            console.log(req.file.path);
        } else {
            exceltojson = xlstojson;
            console.log(req.file.path);
        }
        try {
            exceltojson({
                // this is the path where the uploaded excel file is
                input: req.file.path, 
                output: null, 
                lowerCaseHeaders: true
            },  (err, result) => {
                if (err) {
                    return res.status(500).json({ statusCode: 500, statusDesc: err, data: null });
                }
                Students.create(result, (err, savedData) => {
                    // for rendering from server to client 
                    try {
                        res.redirect('/scoresheet');
                    } catch (err) {
                        console.log(err);
                    }
                });             
            });
        } catch (e) {
            res.status(400).json({ statusCode: 400, statusDesc: "Bad request, Corupted excel file" });
        }
    });
});

app.delete('/scoresheet/:id', (req, res) => {
    try{
        Students.findByIdAndDelete(req.params.id, (err, deleted)=> {
        res.status(200).send({statusCode:200, statusDesc: "One student item deleted"})
        // res.redirect('/scoresheet');
        });
    } catch (err) {
        console.error('error deleting requested data');
    }
});

const server = app.listen(port, ip, (req, res)=> {
    console.log(`excel uploader app started on port ${port} you can also open on http://${ip}/${port}`)
});