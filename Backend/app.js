import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongoose.js'
import connectCloudinary from './config/cloudinary.js'
const app = express();
const port = process.env.port || 4000
connectDB();
connectCloudinary();

app.use(express.json());
app.use(cors());

app.get('/',(req,res)=>{
    res.send("API working");
})
app.listen(port,()=>{
     console.log("Server started at http://localhost:4000");
})