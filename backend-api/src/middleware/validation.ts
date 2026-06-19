import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map((err: any) => ({
                field: err.param || err.path?.[0] || 'unknown',
                message: err.msg,
                value: err.value || null
            })),
        });
        return;
    }
    next();
};

// Auth validations
export const validateSendOTP = [
    body('phone').isMobilePhone('any').withMessage('Valid phone number required'),
    validate,
];

export const validateVerifyOTP = [
    body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('6-digit OTP required'),
    validate,
];

export const validateRegister = [
    body('phone').isMobilePhone('any').withMessage('Valid phone number required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate,
];

export const validateLogin = [
    body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
];

export const validateRegisterDriver = [
    body('phone').isMobilePhone('any').withMessage('Valid phone number required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('6-digit OTP required'),
    body('licenseNumber').notEmpty().withMessage('License number required'),
    body('vehicleType').isIn(['MOTO', 'BUS', 'MINIBUS']).withMessage('Valid vehicle type required'),
    body('vehicleNumber').notEmpty().withMessage('Vehicle number required'),
    body('vehicleModel').notEmpty().withMessage('Vehicle model required'),
    validate,
];

// Ride validations
export const validateRequestRide = [
    body('pickupLat').isFloat().withMessage('Valid pickup latitude required'),
    body('pickupLng').isFloat().withMessage('Valid pickup longitude required'),
    body('pickupAddress').notEmpty().withMessage('Pickup address required'),
    body('dropoffLat').isFloat().withMessage('Valid dropoff latitude required'),
    body('dropoffLng').isFloat().withMessage('Valid dropoff longitude required'),
    body('dropoffAddress').notEmpty().withMessage('Dropoff address required'),
    body('distance').isFloat({ min: 0 }).withMessage('Valid distance required'),
    body('duration').isInt({ min: 0 }).withMessage('Valid duration required'),
    body('fare').isFloat({ min: 0 }).withMessage('Valid fare required'),
    body('paymentMethod').isIn(['WALLET', 'MOBILE_MONEY', 'CASH']).withMessage('Valid payment method required'),
    validate,
];

export const validateUpdateRideStatus = [
    param('id').isString().notEmpty().withMessage('Ride ID required'),
    body('status').isIn(['ACCEPTED', 'STARTED', 'COMPLETED', 'CANCELLED']).withMessage('Valid status required'),
    validate,
];

export const validateCancelRide = [
    param('id').isString().notEmpty().withMessage('Ride ID required'),
    body('reason').optional().isString(),
    validate,
];

export const validateActivateSOS = [
    param('id').isString().notEmpty().withMessage('Ride ID required'),
    body('lat').optional().isFloat(),
    body('lng').optional().isFloat(),
    validate,
];

// Driver validations
export const validateUpdateLocation = [
    body('lat').isFloat().withMessage('Valid latitude required'),
    body('lng').isFloat().withMessage('Valid longitude required'),
    body('isOnline').optional().isBoolean(),
    validate,
];

export const validateAcceptRide = [
    param('id').isString().notEmpty().withMessage('Ride ID required'),
    validate,
];

// Payment validations
export const validateTopUpWallet = [
    body('amount').isFloat({ min: 100 }).withMessage('Amount must be at least 100 RWF'),
    validate,
];

export const validateWithdrawal = [
    body('amount').isFloat({ min: 1000 }).withMessage('Amount must be at least 1000 RWF'),
    validate,
];

// SOS validations
export const validateTriggerSOS = [
    body('rideId').isString().notEmpty().withMessage('Ride ID required'),
    body('lat').optional().isFloat(),
    body('lng').optional().isFloat(),
    validate,
];

// Admin validations
export const validateApproveDriver = [
    param('id').isString().notEmpty().withMessage('Driver ID required'),
    validate,
];

export const validateRejectDriver = [
    param('id').isString().notEmpty().withMessage('Driver ID required'),
    body('reason').optional().isString(),
    validate,
];

export const validateUpdateUser = [
    param('id').isString().notEmpty().withMessage('User ID required'),
    body('name').optional().isString().withMessage('Name must be a string'),
    body('phone').optional().isMobilePhone('any').withMessage('Valid phone required'),
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('role').optional().isIn(['RIDER', 'DRIVER', 'ADMIN']).withMessage('Valid role required'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    validate,
];

// Pagination validation
export const validatePagination = [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    validate,
];

export const validateRateRide = [
    param('id').isString().notEmpty().withMessage('Ride ID required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString(),
    validate,
];

export const validateUpdateProfile = [
    body('name').optional().isString().withMessage('Name must be a string'),
    body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
    body('email').optional().isEmail().withMessage('Valid email required'),
    validate,
];

export const validateChangePassword = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    validate,
];