const express = require('express');

const authRouter =  express.Router();
const {register, login,logout, adminRegister,deleteProfile, checkEmailAvailable} = require('../controllers/userAuthent')
const userMiddleware = require("../middleware/userMiddleware");
const adminMiddleware = require('../middleware/adminMiddleware');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Register
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', userMiddleware, logout);
authRouter.post('/admin/register', adminMiddleware ,adminRegister);
authRouter.delete('/deleteProfile',userMiddleware,deleteProfile);
// Soft authentication check: never returns 401, always 200 to avoid noisy console errors.
authRouter.get('/check', async (req,res)=>{
    try {
        const token = req.cookies?.token;
        if(!token){
            return res.status(200).json({ user: null, message: 'No session' });
        }
        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_KEY);
        } catch(e){
            return res.status(200).json({ user: null, message: 'No session' });
        }
        const user = await User.findById(payload._id).select('firstName emailId role _id');
        if(!user){
            return res.status(200).json({ user: null, message: 'No session' });
        }
        return res.status(200).json({ user, message: 'Valid User' });
    } catch(err){
        return res.status(200).json({ user: null, message: 'No session' });
    }
});
// Email availability (dev helper)
authRouter.get('/available', checkEmailAvailable);
// authRouter.get('/getProfile',getProfile);


module.exports = authRouter;

// login
// logout
// GetProfile

