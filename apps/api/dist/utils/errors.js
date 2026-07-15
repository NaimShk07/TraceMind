export class AppError extends Error {
    statusCode;
    code;
    constructor(statusCode, code, message) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
export class BadRequestError extends AppError {
    constructor(message, code = 'BAD_REQUEST') {
        super(400, code, message);
    }
}
export class UnauthorizedError extends AppError {
    constructor(message, code = 'UNAUTHORIZED') {
        super(401, code, message);
    }
}
export class NotFoundError extends AppError {
    constructor(message, code = 'NOT_FOUND') {
        super(404, code, message);
    }
}
export class InternalServerError extends AppError {
    constructor(message, code = 'INTERNAL_SERVER_ERROR') {
        super(500, code, message);
    }
}
