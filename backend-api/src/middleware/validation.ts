import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

// Auth validations
export const validateSendOTP = [
  body('phone').isMobilePhone('any').withMessage('Valid phone number required'),
  validate,
];

export const validateVerifyOTP = [
  body('phone').isMobilePhone('any').withMessage('Valid phone number required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('6-digit OTP required'),
  validate,
];

export const validateRegisterDriver = [
  body('phone').isMobilePhone('any').withMessage('Valid phone number required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('6-digit OTP required'),
  body('licenseNumber').notEmpty().withMessage('License number required'),
  body('experienceYears').isInt({ min: 0 }).withMessage('Valid experience years required'),
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
  param('rideId').isString().notEmpty().withMessage('Ride ID required'),
  validate,
];

// Payment validations
export const validateProcessMobileMoney = [
  body('rideId').isString().notEmpty().withMessage('Ride ID required'),
  body('phoneNumber').isMobilePhone('any').withMessage('Valid mobile money number required'),
  validate,
];

export const validateProcessWalletPayment = [
  body('rideId').isString().notEmpty().withMessage('Ride ID required'),
  validate,
];

export const validateProcessCashPayment = [
  body('rideId').isString().notEmpty().withMessage('Ride ID required'),
  validate,
];

export const validateTopUpWallet = [
  body('amount').isFloat({ min: 100 }).withMessage('Amount must be at least 100 RWF'),
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

// Pagination validation
export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
];