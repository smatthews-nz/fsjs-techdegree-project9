//require the check module
const { check } = require('express-validator');

const firstName = check('firstName')
.exists({ checkNull: true, checkFalsy: true})
.withMessage('Please provide a value for the "firstName" field');

const lastName = check('lastName')
.exists({ checkNull: true, checkFalsy: true})
.withMessage('Please provide a value for the "lastName" field');

const password = check('password')
.exists({ checkNull: true, checkFalsy: true})
.withMessage('Please provide a value for the "password" field');

const email = check('emailAddress')
.exists({ checkNull: true, checkFalsy: true})
.withMessage('Please provide a value for the "emailAddress" field')
.isEmail()
.withMessage('Please provide a valid email address');

const title = check('title')
.exists({ checkNull: true, checkFalsy: true})
.withMessage('Please provide a value for the "title" field');

const description = check('description')
.exists({ checkNull: true, checkFalsy: true})
.withMessage('Please provide a value for the "description" field');

const userId = check('userId')
.exists({ checkNull: true, checkFalsy: true})
.withMessage('Please provide a value for the "userId" field');

const validations = {
    firstName,
    lastName,
    password,
    email,
    title,
    description,
    userId
};

module.exports = validations;