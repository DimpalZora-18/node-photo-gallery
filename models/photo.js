const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
    title:{
        type : String,
        required : true
    },
    filename :{
        type : String
    },
    filepath :{
        type : String
    },
    upalodedAt :{
        type :Date,
        default :Date.now()
    }
});

module.exports = mongoose.model('Photo',photoSchema);