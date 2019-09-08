// require express
const express = require('express');
// initialize express router
const router = express.Router();
//require db
const db = require('./db');
const { User, Course } = db.models;

/*
USER ROUTING-------------------------------//
*/
// get route returns the currently authenticated user, returns 200
router.get('/user', async (req, res) => {
    

    
    res.status(200).end();
});

//post route creates a new user, and returns a 201 status with no content, redirects to /
router.post('/user', async (req, res) => {
   
    try {

     res.status(201).end();
    } catch (error){

    }

});

/*
COURSE ROUTING-------------------------------//
*/