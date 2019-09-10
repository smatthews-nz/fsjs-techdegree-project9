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


//set up the bodyParser to be used in the router
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended : true }))
/*
USER ROUTING-------------------------------//
*/
// get route returns the currently authenticated user, returns 200
router.get('/users', async (req, res) => {
    
    try {
      // check if the user is authenticated

      //if authenticated, retrieve the user record based on their email address

      
      res.status(200).end();
    } catch (error){

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

});

/*
COURSE ROUTING-------------------------------//
*/

module.exports = router;