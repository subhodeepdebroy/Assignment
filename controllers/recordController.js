const Record = require('../models/record')
const response = require('../helper/response-handle')
const getBookInfo = require('../repository/booksInfo')
const bookIssueValschema = require('../models/bookIssueValSchema')
const stockCheck = require('../repository/stockCheck')
const recordCheckByIds = require('../repository/identicalRecordDocCheck')


module.exports = {
    issueBooksByName:  async (req, res) => {
        const bookInfo = Object.values(req.body); //Array of values
      
        //const objLength = Object.keys(req.body).length;                        //lenght of body object
        const { userId } = req.userData; //from JWT payload
        let count = 0;
        // eslint-disable-next-line no-restricted-syntax
        // eslint-disable-next-line guard-for-in
        for (const key in req.body) {
          const bookName = bookInfo[count];
          try {
            const { error } = bookIssueValschema.validate({ bookName })
            if (error) {
              res.status(400).json(response(false, null, error.message))
            } else {
              // eslint-disable-next-line no-await-in-loop
              const obj = await getBookInfo.bookInfoByName(bookName) ///CHange getBookInfoByName
              if (obj === null) {
                res.status(404).json(response(false, null, 'Not Found'))
              } else {
                const result = await stockCheck(obj._id);
                if (result === false) {
                  res.status(400).json(response(false, null, 'Book Out Of Stock')) ///API 4 in place of null
                } else {
                  const check = await recordCheckByIds(obj._id, userId);
      
                  if (check === null) {
                    const rec = new Record({
                      userId,
                      bookId: obj._id,
                      currentPrice: obj.price,
                    })
      
                    rec.save((error) => { if (error) { throw error } });
                    if (count === Object.keys(req.body).length - 1) {
                      res.status(200).json(response(true, null, 'Entry Successful'))
                    }
                  } else {
                    res.status(400).json(response(false, null, 'One book already Issued'))
                  }
                }
              }
            }
          } catch (error) {
            console.log(error)
          }
      
          count += 1
        }
      }

}