// require express
const express = require('express');
// initialize express router
const router = express.Router();
//require db
const db = require('./db');
const bodyParser = require('body-parser');
const { User, Course } = db.models;


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
    // get user data from the request body
    const user = req.body;

    try {
      await User.create({user});
      // if successful creating the user, send a 201 response, and end.
      res.status(201).end();
      //redirect the user to the `/` route
    } catch (error){
      console.error('Error occured adding user to the database', error);
    }
    
});

/*
COURSE ROUTING-------------------------------//
*/

module.exports = router;