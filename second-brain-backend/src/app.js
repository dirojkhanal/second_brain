import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import routes from "./routes/index.js";
const app = express();


//MIDDLEWARES FOR SECURITY 
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true}));
app.use(cookieParser());
//Routes 
app.get('/health', (req, res) => {
    res.send('Welcome to the Second Brain API');
});

app.use('/api/v1', routes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;