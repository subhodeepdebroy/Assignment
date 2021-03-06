const Record = require('../models/record')
const bookQuery = require('../repository/bookQuery')
const bookIssueValschema = require('../models/bookIssueValidationSchema')
const stockCheckQuery = require('../repository/stockCheckQuery')
const recordQuery = require('../repository/recordQuery')
const userQuery = require('../repository/userQuery')
const customError = require('../helper/appError')


const issueBookByName = async (body, userData) => {
  try {
    const bookInfo = Object.values(body); //Array of values

    const { userId } = userData;          //from JWT payload

    const userObj = await userQuery.userFindOneById(userData.userId);

    const date1 = new Date(userObj.dob);
    const date2 = new Date(Date.now());
    const diffTime = Math.abs(date2 - date1);
    const age = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365))


    let len = Object.keys(body).length;
    let bookObjArray = [];
    let bookRejected = [];


    for (let count = 0; count < len; count++) {
      const bookName = bookInfo[count];

      const obj = await bookQuery.bookInfoByParameter({ $and: [{ bookName }, { isDiscarded: false }] });

      if (obj !== null) {
        bookObjArray.push(obj);

      }
    }
    let len2 = bookObjArray.length;
    let bookObjArray2 = [];
    if (len2 === 0) {
      throw new customError.NotFoundError('No Book Found');
    } else {
      bookRejected = [];
      for (let count = 0; count < len2; count++) {
        const rating = bookObjArray[count].rating;
        if (rating === 'pg' && age < 13) {
          bookRejected.push(bookObjArray[count].bookName);

        } else if (rating === 'r' && age < 17) {
          bookRejected.push(bookObjArray[count].bookName);

        } else {
          bookObjArray2.push(bookObjArray[count]);
        }

      }

    }
    let len3 = bookObjArray2.length;
    let bookObjArray3 = [];
    if (len3 === 0) {
      throw new customError.BadInputError(`Not Appropriate for your Age -${bookRejected}`);
    } else {
      bookRejected = [];
      for (let index = 0; index < len3; index++) {
        const bookId = bookObjArray2[index]._id;
        console.log(bookId, len3);
        const result = await stockCheckQuery(bookId);
        console.log(result);
        if (result) {
          bookObjArray3.push(bookObjArray2[index]);
        }
        else {
          bookRejected.push(bookObjArray2[index].bookName);
        }

      }
    }
    let len4 = bookObjArray3.length;
    let bookObjArray4 = [];
    if (len4 === 0) {
      throw new customError.BadInputError(`Book Out Of Stock-${bookRejected}`);
    } else {
      bookRejected = [];
      for (let index = 0; index < len4; index++) {
        const bookId = bookObjArray3[index]._id;
        const check = await recordQuery.docCheckById(bookId, userId);
        if (check === null) {
          bookObjArray4.push(bookObjArray3[index]);
        } else {
          bookRejected.push(bookObjArray3[index].bookName);

        }

      }

    }
    let len5 = bookObjArray4.length;
    let bookObjArray5 = [];

    if (len5 === 0) {
      throw new customError.BadInputError(`One Book Already Issued- ${bookRejected}`);
    } else {
      for (let index = 0; index < len5; index++) {
        bookObjArray5.push(bookObjArray4[index].bookName);
        const record = new Record({
          userId,
          bookId: bookObjArray4[index]._id,
          currentPrice: bookObjArray4[index].price,
        })

        await record.save();

      }


      return bookObjArray5;
    }
  } catch (error) {
    throw error;
  }

}


const getBookIssueInfoByUserId = async (body, userData, params) => {
  try {
    if (userData.isAdmin) {

      const count = await recordQuery.docCountByParameter({ userId: body.userId });

      if (count === 0) {
        throw new customError.NotFoundError('No Record Exist');
      } else {
        const recordArrayObject = await recordQuery.allRecordInfoByParameter(parseInt(params.from), parseInt(params.to), { userId: body.userId });
        recordArrayObject.push({ numberOfRecords: count })

        return recordArrayObject;
      }
    } else if (body.userId === userData.userId) {
      const count = await recordQuery.docCountByParameter({ userId: userData.userId });
      if (count === 0) {
        throw new customError.NotFoundError('No Record Exist');
      } else {
        const recordArrayObject = await recordQuery.allRecordInfoByParameter(parseInt(params.from), parseInt(params.to), { userId: userData.userId });
        recordArrayObject.push({ numberOfRecords: count })

        return recordArrayObject;
      }
    } else {
      throw new customError.BadInputError('Invalid userId sent');
    }
  } catch (error) {
    throw error;
  }
}



const expenceCheck = async (body, userData, params) => {
  try {
    if (userData.isAdmin) {
      const data = await userQuery.userFindOneById(body.userId);
      if (data === 0) {
        throw new customError.BadInputError('Invalid userId sent');
      } else {
        const date = new Date(Date.now());
        date.setDate(date.getDate() - params.days)

        const recordObj = await recordQuery.priceSumBasedOnUserIdDate(body.userId, date);

        if (recordObj.length === 0) {

          return [null, `No Money Spent in last ${params.days} Days `];
        } else {

          return [recordObj[0].expence, `This Much Money Spent in last ${params.days} Days`];
        }
      }
    } else if (body.userId === userData.userId) {
      const date = new Date(Date.now());
      date.setDate(date.getDate() - params.days)

      const recordObj = await recordQuery.priceSumBasedOnUserIdDate(body.userId, date);

      if (recordObj.length === 0) {

        return [null, `No Money Spent in last ${params.days} Days `];
      } else {

        return [recordObj[0].expence, `This Much Money Spent in last ${params.days} Days`];
      }
    } else {
      throw new customError.BadInputError('Invalid userId sent');
    }
  } catch (error) {
    throw error;
  }

}



const getBooksRentedByUserId= async (body, userData, params) => {
  try {
    if (userData.isAdmin) {
      const count = await recordQuery.docCountByParameter({ userId: body.userId });
      if (count === 0) {
        throw new customError.NotFoundError('No Record Exist');
      } else {
        const recordArrayObject = await recordQuery.allRecordInfoByParameter(parseInt(params.from), parseInt(params.to), { userId: body.userId });
        const len = recordArrayObject.length;
        const booklist = [];
        for (let i = 0; i < len; i++) {
          const obj = await bookQuery.bookInfoById(recordArrayObject[i].bookId);

          booklist[i] = obj;


        }
        booklist.push({ numberOfBooks: count })

        return booklist;
      }
    } else if (body.userId === userData.userId) {
      const count = await recordQuery.docCountByParameter({ userId: userData.userId });
      if (count === 0) {
        throw new customError.NotFoundError('No Record Exist');
      } else {
        const recordArrayObject = await recordQuery.allRecordInfoByParameter(parseInt(params.from), parseInt(params.to), { userId: userData.userId });
        const booklist = [];
        for (let i = 0; i < count; i++) {
          const obj = await bookQuery.bookInfoById(recordArrayObject[i].bookId);

          booklist[i] = obj;
        }
        booklist.push({ numberOfBooks: count })

        return booklist;
      }
    } else {

      throw new customError.BadInputError('Invalid userId Sent');
    }
  } catch (error) {
    throw error;
  }
}



const returnIssuedBook= async (body, userData) => {
  try {
    if (userData.isAdmin) {

      const record = await recordQuery.docCheckById(body.bookId, body.userId);
      if (record === null) {
        throw new customError.NotFoundError('No Such Record Exist');
      } else {
        record.returned = true;
        await record.save()

        return;
      }
    } else {
      throw new customError.AuthorizationError('Forbidden');
    }
  } catch (err) {
    throw err;
  }

}


module.exports = { issueBookByName, getBookIssueInfoByUserId, expenceCheck, getBooksRentedByUserId, returnIssuedBook }