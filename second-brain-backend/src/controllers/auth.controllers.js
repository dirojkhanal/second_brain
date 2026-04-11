import * as authService from "../services/auth.services.js";

const COOKIE_OPTIONS = {

    httpOnly:true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
//Register
export const register = async(req, res) => {
    const {user , accessToken, refreshToken} = await authService.userRegister(req.body);
    res.cookie ('accessToken', accessToken, COOKIE_OPTIONS);
    res.status(201).json({
        status: 'success',
        message: 'User created successfully',
        data: {
            user,
            accessToken,
        },
    })
};

//Login 
export const login = async(req, res) => {
    const {user , accessToken, refreshToken} = await authService.userLogin(req.body);
    res.cookie ('accessToken', accessToken, COOKIE_OPTIONS);
    res.status(200).json({
        status: 'success',
        message: 'User logged in successfully',
        data: {
            user,
            accessToken,
        },
    })
};

