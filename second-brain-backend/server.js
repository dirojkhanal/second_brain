import app from './src/app.js';
const PORT = process.env.PORT || 5000;

const start = async() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

};

start();