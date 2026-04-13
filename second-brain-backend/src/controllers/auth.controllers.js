import * as authService from '../services/auth.services.js';
const ACCESS_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes 
};

const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, 
};

export const register = async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.userRegister(req.body);
    
    res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS); 
    res.status(201).json({
        status: 'success',
        message: 'User created successfully',
        data: { user }, // don't send tokens in body if using cookies
    });
};

export const login = async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.userLogin(req.body);
    
    res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS); 
    
    res.status(200).json({
        status: 'success',
        message: 'User logged in successfully',
        data: { user },
        refreshToken
    });
};
export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    await authService.userLogout(refreshToken);

    // clear cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      status: "success",
      message: "User logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

//refresh tokens 
export const refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken; 
    
    const { user, accessToken, refreshToken: newRefreshToken } = 
        await authService.refreshAccessToken(refreshToken);
    
    res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);
    
    res.status(200).json({
        status: 'success',
        data: { user },
    });
};
export const forgotPassword = async (req, res) => {
    await authService.forgotPassword(req.body);

    // always return success — don't reveal if email exists
    res.status(200).json({
        status: 'success',
        message: 'If this email exists, an OTP has been sent.',
    });
};