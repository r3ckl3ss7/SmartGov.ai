import express from 'express'
import dotenv from 'dotenv'
dotenv.config()
import userRoutes from './routes/user.routes.js'
const app=express()


app.use('/users',userRoutes)

export default app