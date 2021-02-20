/* eslint-disable consistent-return */
const { ObjectID } = require('mongodb');
const User = require('../models/user-joigoose')
//const response = require('../helper/response-handle');

module.exports = {
  userFindOne: async (parameter) => {
    // eslint-disable-next-line no-useless-catch
    try {
      const user = await User.findOne(parameter);
      return user;
    } catch (error) {
      throw error;
    }
  },
  userFindAllWithoutId: async () => {
    // eslint-disable-next-line no-useless-catch
    try {
      // eslint-disable-next-line no-unused-vars
      const user = await User.find({}, { _id: 0, __v: 0 })
      return user;
    } catch (error) {
      throw error;
    }
  },
}