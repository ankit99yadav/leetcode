const redisClient = require("../config/redis");
const User =  require("../models/user")
const validate = require('../utils/validator');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const Submission = require("../models/submission")


const register = async (req,res)=>{
    
    try{
        // validate the data;
      validate(req.body); 
      const { firstName, emailId, password } = req.body;
      const normalizedEmail = typeof emailId === 'string' ? emailId.trim().toLowerCase() : '';

      if (!normalizedEmail) {
          return res.status(400).json({ message: "Invalid Email" });
      }

      req.body.emailId = normalizedEmail;

      console.log(`Attempting to register with email: ${normalizedEmail}`);

      // Explicitly check if user already exists
      const existingUser = await User.findOne({ emailId: normalizedEmail });
      if (existingUser) {
          console.log(`Found existing user for email ${normalizedEmail}:`, existingUser._id);
          return res.status(409).json({ message: "Email already exists" });
      }

      console.log(`Email ${normalizedEmail} is new. Proceeding with registration.`);
      req.body.password = await bcrypt.hash(password, 10);
      req.body.role = 'user'
    //
    
    const user =  await User.create(req.body);
    const token =  jwt.sign({_id:user._id , emailId: normalizedEmail, role:'user'},process.env.JWT_KEY,{expiresIn: 60*60});
     const reply = {
        firstName: user.firstName,
        emailId: user.emailId,
        _id: user._id,
        role:user.role,
    }
    
    res.cookie('token',token,{maxAge: 60*60*1000, httpOnly: true, sameSite: 'lax', path: '/' });
     res.status(201).json({
        user:reply,
        message:"Loggin Successfully"
    })
    }
    catch(err){
        console.error("Register error:", err);
        // Handle duplicate errors clearly
        if (err && err.code === 11000) {
            const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'emailId';
            const value = err.keyValue ? err.keyValue[field] : undefined;
            return res.status(409).json({ message: "Email already exists", field, value });
        }
        const message = err instanceof Error ? err.message : "Registration failed";
        res.status(400).json({ message });
    }
}


const login = async (req, res) => {
    try {
        const { emailId, password } = req.body;

        const normalizedEmail = typeof emailId === 'string' ? emailId.trim().toLowerCase() : '';

        if (!normalizedEmail || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ emailId: normalizedEmail });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role,
        };

        const token = jwt.sign({ _id: user._id, emailId: normalizedEmail, role: user.role }, process.env.JWT_KEY, { expiresIn: 60 * 60 });
        res.cookie('token', token, { maxAge: 60 * 60 * 1000, httpOnly: true, sameSite: 'lax' });
        return res.status(200).json({
            user: reply,
            message: "Login Successfully"
        });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}


// logOut feature

const logout = async(req,res)=>{

    try{
        const {token} = req.cookies;
        const payload = jwt.decode(token);


        await redisClient.set(`token:${token}`,'Blocked');
        await redisClient.expireAt(`token:${token}`,payload.exp);
    //    Token add kar dung Redis ke blockList
    //    Cookies ko clear kar dena.....

    res.cookie("token",null,{expires: new Date(Date.now())});
    res.send("Logged Out Succesfully");

    }
    catch(err){
       res.status(503).send("Error: "+err);
    }
}


const adminRegister = async(req,res)=>{
    try{
        // validate the data;
    //   if(req.result.role!='admin')
    //     throw new Error("Invalid Credentials");  
      validate(req.body); 
      const {firstName, emailId, password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);
    //
    
     const user =  await User.create(req.body);
     const token =  jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
     res.cookie('token',token,{maxAge: 60*60*1000});
     res.status(201).send("User Registered Successfully");
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}

const deleteProfile = async(req,res)=>{
  
    try{
       const userId = req.result._id;
      
    // userSchema delete
    await User.findByIdAndDelete(userId);

    // Submission se bhi delete karo...
    
    // await Submission.deleteMany({userId});
    
    res.status(200).send("Deleted Successfully");

    }
    catch(err){
      
        res.status(500).send("Internal Server Error");
    }
}


const checkEmailAvailable = async (req, res) => {
    try {
        const raw = req.query.email || '';
        const email = raw.trim().toLowerCase();
        if (!email) return res.status(400).json({ message: 'Email is required' });
        const existing = await User.findOne({ emailId: email }).select('_id emailId');
        return res.status(200).json({ exists: !!existing });
    } catch (err) {
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

module.exports = {register, login,logout,adminRegister,deleteProfile, checkEmailAvailable};