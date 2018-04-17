// const bodyParser = require('body-parser');
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');

const STATUS_USER_ERROR = 422;
const BCRYPT_COST = 11;

const User = require('./user.js');

const server = express();
// to enable parsing of json bodies for post requests
server.use(express.json());

server.use(
  session({
    secret: 'e5SPiqsEtjexkTj3Xqovsjzq8ovjfgVDFMfUzSmJO21dtXs4re',
    name: 'auth',
    cookie: {maxAge: 1 * 24 * 60 * 60 * 1000 },
    secure: false,
    saveUninitialized: false,
    resave: false,
  })
);


const isLoggedIn = function (req, res, next) {
  console.log(req.session.name);
  if(!req.session.name) {
   sendUserError('Not logged in', res);
  }
  req.user =req.session.name;
  return next();
}

/* Sends the given err, a string or an object, to the client. Sets the status
 * code appropriately. */
const sendUserError = (err, res) => {
  res.status(STATUS_USER_ERROR);
  if (err && err.message) {
    res.json({ message: err.message, stack: err.stack });
  } else {
    res.json({ error: err });
  }
};

// TODO: implement routes
server.post('/users', (req, res) => {
  console.log(req.body);
  const { username, password } = req.body;
  const passwordHash = password.trim();
  const newUser = new User({ username, passwordHash });

  if(!username) {
    return sendUserError('Username is missing', res);
  }
  else if (!passwordHash) {
    return sendUserError('Password is missing', res);
  }

  newUser
    .save((error, user) => {
      if (error) {
        return sendUserError(error, res);
      }
      res.status(200).json(user);
    })
});

server.post('/log-in', (req, res) => {
  const { username, password } = req.body;
  console.log("in login, username: ", username);
  if (username && password.trim()) {
    User.findOne({ username }).then(user => {
      if (user) {
        user.isPasswordValid(password).then(isValid => {
          if (isValid) {
            req.session.name = username;
            res.status(200).json({success: true});
            //console.log(req.session.name)
          } else {
            return sendUserError({ error:'Incorrect Credentials' }, res);
          }
        });
      }
    })
    .catch((error) => {
      return sendUserError(error, res);
    });
  } else {
    return sendUserError({error: 'Username and Password required to log-in.'},res);
  }
});


// TODO: add local middleware to this route to ensure the user is logged in
server.get('/me', isLoggedIn, (req, res) => {
  // Do NOT modify this route handler in any way.
  res.json(req.user);
});

module.exports = { server };