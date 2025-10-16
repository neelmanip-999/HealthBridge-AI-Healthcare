// HealthBridge/backend/validations/pharmacyValidation.js
const Joi = require('joi');

const pharmacyAddValidation = Joi.object({
  medicineName: Joi.string().min(2).required(),
  stock: Joi.number().integer().min(0).required(),
  price: Joi.number().min(0.01).required(),
  expiryDate: Joi.date().min('now').required(),
  pharmacistName: Joi.string().required()
});

module.exports = { pharmacyAddValidation };