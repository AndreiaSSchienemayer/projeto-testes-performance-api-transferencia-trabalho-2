const bcrypt = require('bcryptjs');

// In-memory user database
const users = [
  {
    username: 'Ivonei', 
    password: bcrypt.hashSync('123456', 8), 
    favorecidos: [ 'Andreia' ], 
    saldo: 10000
  },
  {
    username: 'Andreia', 
    password: bcrypt.hashSync('123456', 8), 
    favorecidos: [ 'Arthur' ], 
    saldo: 10000
  },
  {
    username: 'Arthur', 
    password: bcrypt.hashSync('123456', 8), 
    favorecidos: [ 'Andreia' ], 
    saldo: 10000
  },
  {
    username: 'Andreia', 
    password: bcrypt.hashSync('123456', 8), 
    favorecidos: [ 'Ivonei' ], 
    saldo: 10000
  }
];

module.exports = {
  users
};
