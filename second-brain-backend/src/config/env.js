import dotenv from 'dotenv';

dotenv.config();

const required =[
    'DATABASE_URL',
    // 'JWT_ACCESS_SECRET',
    // 'JWT_REFRESH_SECRET',
    // 'JWT_ACCESS_EXPIRES_IN',
    // 'JWT_REFRESH_EXPIRES_IN',  
    //clientUrl 
];

//FAIL FAST : CRASH ON STARTUP IF THERE ARE MISSING ENV VARIABLES
required.forEach((key)=>{
    if(!process.env[key]){
        throw new Error(`Missing environment variable ${key}`);
    }   
});

export const config ={
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    db: {url: process.env.DATABASE_URL},
    // jwt: {
    //     accessSecret: process.env.JWT_ACCESS_SECRET,
    //     refreshSecret: process.env.JWT_REFRESH_SECRET,
    //     accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    //     refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    // },
    // ClientUrl: process.env.CLIENT_URL,
    
};