import express, { Express } from 'express';
import { connectDatabase } from './config/database';
import userRoutes from './routes/userRoutes';


import dotenv from 'dotenv';
dotenv.config();


const app: Express = express();

connectDatabase()

const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3200;

app.use(express.json());
app.use('/users', userRoutes);


export { app, PORT }