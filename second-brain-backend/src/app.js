import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();


//MIDDLEWARES FOR SECURITY 
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true}));
//Routes 
app.get('/health', (req, res) => {
    res.send('Welcome to the Second Brain API');
});

// Error handling middleware




export default app;