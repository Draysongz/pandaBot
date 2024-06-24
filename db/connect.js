const mongoose = require('mongoose')
const dotenv = require('dotenv').config()


const MONGO_URI = process.env.MONGO_URI || "";



const connectDB = async()=>{
    try {
        const conn = await mongoose.connect(MONGO_URI);
        console.log("Db connected successfully", conn.connection.id) 
    } catch (error) {
        console.log('error connecting', error)
    }
}

module.exports = {
    connectDB
}