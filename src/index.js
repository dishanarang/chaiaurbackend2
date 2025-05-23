//require('dotenv').config({path:'./env'})  ->reduces code consistency coz below we are using import
import dotenv from 'dotenv'
//import mongoose from 'mongoose'
//import {DB_NAME} from "./constants";
import connectDB from "./db/index.js";
import {app} from './app.js'
dotenv.config({
    path:'./.env'
    
})

//connectDB was an async function so it returns a promise therefore we are using .then() and .catch()
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running at port : ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log("mongoDB connection failed !!! ", error)
})


/* 1st->approach
import express from 'express'
const app=express()
(async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on('error',(error)=>{
            console.log("ERRR:", error);
            throw error;
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    }
    catch(error){
        console.log("ERROR:",error)
        throw error
    }
})()
*/