const Joi = require('joi');

const patientRegisterValidation = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  age: Joi.number().integer().min(1).max(120).required(),
  gender: Joi.string().valid("male", "female", "other").required(),
  medicalHistory: Joi.array().items(Joi.string()).optional()
});

const patientLoginValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

module.exports = { patientRegisterValidation, patientLoginValidation };
