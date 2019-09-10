// require express
const express = require('express');
// initialize express router
const router = express.Router();
//require db
const db = require('./db');
//require db models
const { User, Course } = db.models;
//require bodyParser to access the request body
const bodyParser = require('body-parser');
//require bcryptjs
const bcrypt = require('bcryptjs');
//require basic-auth so we can use it to gather auth from the header
const auth = require('basic-auth');


//set up the bodyParser to be used in the router
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended : true }))

/*
USER AUTH MIDDLEWARE-------------------------------//
*/
 const authenticateUser = async (req, res, next) => {
  // declare a message variable for error handling
  let message = '';
  // get the users credentials from the auth header
  const credentials = auth(req);
  //if the user has credentials
  if(credentials){
    // find the user from the db
    const user = await User.findOne({
        where: {
            emailAddress : credentials.name
        }
    });
    // if a user was successfully retrieved from the database
    if(user){
      //compare the passwords using bcrypt and users password.
      const authenticated = bcrypt.compareSync(credentials.pass, user.password);
      //if the passwords match, then the user is authenticated
      if(authenticated){
        console.log(`Authentication successful for user: ${user.emailAddress}`);

        //store the user in the current user req object
        req.currentUser = user;
      } else {
        message = `Authentication failure for user: ${credentials.name}`;
      }
    } else {
        message = `User not found for user: ${credentials.name}`
    }
  } else {
      message = `Authorization headers not found`
  }
  // if a users authentication fails, print warning message to the console:
  if(message){
    console.warn(message);
    //return a 401 unauthorized error, and end the request
    res.status(401).json({message: 'Access Denied'}).end();
  } else {
    next();
  }
  //end user auth middleware
}

/*
USER ROUTING-------------------------------//
*/
// get route returns the currently authenticated user, returns 200
router.get('/users', authenticateUser, (req, res) => {

  // check if the user is authenticated
  const user = req.currentUser;
  //if authenticated, retrieve the user record based on their email address
  if(user){
    res.json({user})
    res.status(200).end();
  } else {
    res.status(401).json({message: 'You must be authenticated to view this area'}).end();
  }
 
});

//post route creates a new user, and returns a 201 status with no content, redirects to /
router.post('/users', async (req, res) => {
    //use bcrypt to has the users password
    const hashedPword = bcrypt.hashSync(req.body.password);

    // get the user details
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const emailAddress = req.body.emailAddress;
    // build the user so it can be passed to the create method with a single variable.
    const user = {firstName, lastName, emailAddress, hashedPword};

    try {
      await User.create({user});
      // if successful creating the user, send a 201 response, and end.
      res.status(201).end();
      //redirect the user to the `/` route
      res.redirect('/');
    } catch (error){
      console.error('Error occured adding user to the database', error);
    }
    //end create new user route
});

/*
COURSE ROUTING-------------------------------//
*/



module.exports = router;