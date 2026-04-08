import { AppError } from "../utils/appError";

export const notFound = (req, res, next) => {
    next(new AppError('Not Found', 404));
};