// require express
const express = require('express');
// initialize express router
const router = express.Router();
//require db
const db = require('./db');
//require db models
const { User, Course } = db.models;
//require validations
const validations = require('./validations');
//require bodyParser to access the request body
const bodyParser = require('body-parser');
//require bcryptjs
const bcrypt = require('bcryptjs');
//require basic-auth so we can use it to gather auth from the header
const auth = require('basic-auth');
//require express validator lib
const { check, validationResult } = require('express-validator');


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
    res.status(401).json({message: 'You must be authenticated to do this!'}).end();
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
  if(user) {
    res.json({user})
    res.status(200).end();
  } else {
    res.status(401).json({message: 'You must be authenticated to view this area'}).end();
  }
 
});

//post route creates a new user, and returns a 201 status with no content, redirects to /
router.post('/users', [
  validations.firstName,
  validations.lastName,
  validations.email,
  validations.password
], async (req, res, next) => {
  //capture any errors in a variable
  const errors = validationResult(req);
  //if errors is not empty
  if(!errors.isEmpty()){
    // use the Array `map()` method to iterate through all error messages
    const errorMessages = errors.array().map(error => error.msg);
    // return the status 400 - bad request - and any error messages to the client
    res.status(400).json({ errors: errorMessages });
  } else {
    //check if the email address is already taken by another user, using a try/catch block
    try {
      const emailTaken = await User.findOne({
        where: { emailAddress: req.body.emailAddress }
      });
      // if email address is not taken, create the user.
      if(!emailTaken){
        await User.create({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          emailAddress: req.body.emailAddress,
          password: bcrypt.hashSync(req.body.password),
        });
        // if successful creating the user, send a 201 response, and end.
        res.status(201).location('/').end();
        // else if email is already taken, do not create a new user, and alert the client
      } else {
        res.status(400).json({ error: 'That email address is already registered to an account, sorry!'});
      }
    } catch(error) {
      //if any other errors, catch and pass to the global error handler
      next(error);
    }
  }
});

/*
COURSE ROUTING-------------------------------//
*/
// get route retrieves all courses, including the user that owns that course. Returns 200 OK
router.get('/courses', async (req, res) => {
  
  try { 
    //retrieve all courses from the DB
    const courses = await Course.findAll({
      include: [
        {
          model: User,
          as: 'Owner',
          //exclude the createdAt, updateAt, and password attributes from the user
          attributes: { exclude : [ 'createdAt', 'updatedAt', 'password' ]}
        }
      ],
      //exlude the createdAt, and updatedAt attributes from the course
      attributes: { exclude: [ 'createdAt', 'updatedAt' ]},
    });
    // map through courses and provide as plain JSON
    res.json(courses.map(course => course.get({ plain : true})));
    res.status(200).end();
  } catch (error) {
    //log the error, send the response, and close the request
    console.error('Error retrieving records from the database: ', error)
    res.status(400).json({message: 'Error retrieving courses from the database'}).end();
  }
  
  // end get courses route
});

// get route with an id param passed to retrieve a specific course -- returns 200 OK and the course info
router.get('/courses/:id', async (req, res) => {

  try {
    //find the course by the id passed in the request
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'Owner',
          //exclude the createdAt, updateAt, and password attributes from the user
          attributes: { exclude : [ 'createdAt', 'updatedAt', 'password' ]},
        },
      ],
    })
    //return the course as JSON in the response
    res.json(course);
    res.status(200).end();
  } catch (error) {
    //log the error, send the response, and close the request
    console.error('Error retrieving course from the database: ', error)
    res.status(400).json({message: 'Error retrieving course from the database'}).end();
  }
//end get course w/ ID route
})

//post route to create a new course, sets the location header to the newly created course -- returns 201 and no info
router.post('/courses', [
  validations.description,
  validations.title,
  validations.userId
], authenticateUser, async (req, res) => {
  //get the current user from the request
  const user = req.currentUser;
  //capture any errors in a variable
  const errors = validationResult(req);
  //if errors is not empty
  if(!errors.isEmpty()){
    // use the Array `map()` method to iterate through all error messages
    const errorMessages = errors.array().map(error => error.msg);
    // return the status 400 - bad request - and any error messages to the client
    res.status(400).json({ errors: errorMessages });
  } else {
    //check if user is authenticated
    if (user) {
      try {  
        //store the course in a variable so we can access the id propterty after creation
        const course = await Course.create({
          title: req.body.title,
          description: req.body.description,
          userId: req.body.userId,
          materialsNeeded: req.body.materialsNeeded,
          estimatedTime: req.body.estimatedTime
        });
        //set the response to 201, and direct the location to the course id
        res.status(201).location('api/courses' + course.id).end();
      } catch (error) {
        //log the error, send the response, and close the request
        console.error('Error creating new course: ', error);
        res.status(400).json({ message : 'Error creating a new course in the database'}).end();
      }
      //if user is not authenticated
    } else {
      // set status to 401 unauthorized, and close the request
      res.status(401).json({message: 'You must be logged in to create a course'}).end();
    }
  }
  //end course creation route
});


// PUT route to update course details -- returns 204 No content returned
router.put('/course/:id', authenticateUser, async (req, res) => {
  //TODO: write put route to update course details

  // check if the user is logged in
  const user = req.currentUser;

  if(user){
    
    try{ 
      //find the current course by using req.params.id
      const course = await Course.findByPk(req.params.id);
      //update the course using the request body
      await course.update(req.body);
      //sends a 204 response, and end the response.
      res.status(204).end();
    } catch (error) {
      //log the error, send the response, and close the request
      console.error('Error updating the course: ', error);
      res.status(400).json({ message : 'Error updating the course in the database'}).end();
    }

  } else {
    res.status(401).json({ message: 'You must be logged in to update a course'}).end();
  }

  //end put route to update course details
})

// DELETE route to delete a specific course -- returns 204 No content returned
router.delete('/courses/:id', authenticateUser, async (req, res) => {

  //check if the user is logged in
  const user = req.currentUser;

  if (user) {
    try {
      // find the current course using req.params.id
      const course = await Course.findByPk(req.params.id);
      //if a course has been found
      if(course){
        //use sequelize delete to remove the course
        await course.destroy();
        res.status(204).end();
        //return 204, and end the response
      } else {
        //log a message that the course could not be found
        console.error('A course with this ID could not be found');
        res.status(400).json({ message: 'A course with this ID could not be found'}).end();
        //return 400 bad request, and end the response 
      }
    } catch (error) {
      //log the error, send the response, and close the request
      console.error('Error creating deleting course: ', error);
      res.status(400).json({ message : 'Error removing a new course from the database'}).end();
    }
  } else {
     // set status to 401 unauthorized, and close the request
     res.status(401).json({message: 'You must be logged in to delete a course'}).end();
  }

  //end delete route to remove a specific course
})

module.exports = router;