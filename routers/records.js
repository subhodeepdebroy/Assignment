
const express = require('express')
const router = express.Router()
const checkAuthorization = require('../middleware/check-auth')
const recordController = require('../controllers/recordController')
const checkValidation = require('../middleware/validationCheck')

//API to issue a book

router.post('/', checkAuthorization, checkValidation.bookIssueValidator, recordController.issueBooksByName);

// API to get renting history of a user by userId

router.post('/userHistory/:from-:to', checkAuthorization, recordController.getBookInfoByUserId);

//API TO GET EXPENCE OF A USER FOR PAST 'N' DAYS

router.post('/expence/:days', checkAuthorization, recordController.expenceCheck);

//  API to GET BOOKS AND NO. OF BOOKS RENTED BY UserId

router.post('/books/:from-:to', checkAuthorization, recordController.getBooksRentedByUserId);

// API to return issued book

router.patch('/return', checkAuthorization, recordController.returnIssuedBook);


module.exports = router
