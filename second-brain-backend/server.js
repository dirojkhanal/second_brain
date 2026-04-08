import app from './src/app.js';
import { connectDB } from './src/db/index.js';
const PORT = process.env.PORT || 5000;

const start = async() => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

};

start();