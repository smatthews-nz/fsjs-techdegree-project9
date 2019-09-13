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
    res.status(401).json({message: 'You must be authenticated to view this area'}).end();
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
router.post('/users', async (req, res) => {
    //use bcrypt to has the users password
    const hashedPword = bcrypt.hashSync(req.body.password);

    // get the user details
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const emailAddress = req.body.emailAddress;

    try {
      await User.create({
        firstName,
        lastName,
        emailAddress,
        password: hashedPword
      });
      // if successful creating the user, send a 201 response, and end.
      res.status(201).end();
      //set the location header to `/`
      res.setHeader('Location', '/');
    } catch (error) { 
      //log the error, send the response, and close the request
      console.error('Error occured adding user to the database', error);
      res.status(400).json({message: 'Error creating new user'}).end();
    }
    //end create new user route
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
        }
      ]
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
    const course = await Course.findByPk(req.params.id)
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
router.post('/courses', authenticateUser, async (req, res) => {

  //get the current user from the request
  const user = req.currentUser;

  //get the course details from the request
  const title = req.body.title;
  const description = req.body.description;
  const owner = req.body.userId;
  const materialsNeeded = req.body.materialsNeeded;
  const estimatedTime = req.body.estimatedTime;
  //check if user is authenticated
  if (user) {

    try {  
      //store the course in a variable so we can access the id propterty after creation
      const course = await Course.create({
        title,
        description,
        owner,
        materialsNeeded,
        estimatedTime
      });

      //set the response headers to the current course
      res.setHeader('Location', course.id);
      res.status(201).end();
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

  //end course creation route
});
// PUT route to update course details -- returns 204 No content returned
router.put('/course/:id', authenticateUser, async (req, res) => {
  //TODO: write put route to update course details

  // check if the user is logged in
  const user = req.currentUser;

  if(user){
    //find the current course by using req.params.id
    const course = await Course.findByPk(req.params.id);
    
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