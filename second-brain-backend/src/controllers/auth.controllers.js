import * as authService from "../services/auth.services.js";

const COOKIE_OPTIONS = {
    HttpOnly:true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async(req, res) => {
    const {user , accessToken, refreshToken} = await authService.userRegister(req.body);
    res.cookie ('accessToken', accessToken, COOKIE_OPTIONS);
    res.cookie ('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.status(201).json({
        status: 'success',
        message: 'User created successfully',
        data: {
            user,
            accessToken,
        },
    })
};
