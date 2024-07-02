const mongoose = require('mongoose');

const dbConnect = async ()=>{
    try {
        await mongoose.connect('mongodb+srv://Saby:saby1234@cluster0.o3z2pcc.mongodb.net/')
        console.log('Connected to the Database');
    } catch (error) {
        console.log(`Error while connecting ${error}`);
    }
} 



module.exports = dbConnect