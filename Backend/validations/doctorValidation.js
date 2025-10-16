// backend/validations/doctorValidation.js
const Joi = require('joi');

const doctorRegisterValidation = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(), // Minimal length for security
  specialization: Joi.string().required(),
  fees: Joi.number().min(0).required()
});

const doctorLoginValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

module.exports = { doctorRegisterValidation, doctorLoginValidation };