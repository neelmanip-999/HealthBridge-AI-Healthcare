const { body } = require('express-validator');
const registerValidation = (role) => {
  const base = [ body('name').notEmpty().withMessage('Name required'), body('email').isEmail().withMessage('Email required'), body('password').isLength({ min:6 }).withMessage('Password min 6') ];
  if (role === 'doctor') { base.push(body('specialization').notEmpty().withMessage('Specialization required')); base.push(body('consultationFee').isNumeric().withMessage('Consultation fee numeric')); }
  if (role === 'pharmacy') base.push(body('pharmacyName').notEmpty().withMessage('Pharmacy name required'));
  return base;
};
module.exports = { registerValidation };
