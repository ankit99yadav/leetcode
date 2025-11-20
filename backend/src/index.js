// Console Ninja suppression disabled for debugging run/submit issues.
// To silence again set SUPPRESS_NINJA=true in .env.
if(process.env.SUPPRESS_NINJA === 'true'){
    global.ninjaSuppressConsole = true;
    global._ninjaIgnoreError = true;
}

const express = require('express')
const app = express();
require('dotenv').config();
const main =  require('./config/db')
const cookieParser =  require('cookie-parser');
const authRouter = require("./routes/userAuth");
const redisClient = require('./config/redis');
const problemRouter = require("./routes/problemCreator");
const submitRouter = require("./routes/submit")
const aiRouter = require("./routes/aiChatting")
const videoRouter = require("./routes/videoCreator");
const cors = require('cors')

// console.log("Hello")

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // allow non-browser or same-origin
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}))

app.use(express.json());
app.use(cookieParser());

app.use('/user',authRouter);
app.use('/problem',problemRouter);
app.use('/submission',submitRouter);
app.use('/ai',aiRouter);
app.use("/video",videoRouter);

// Global error instrumentation
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

// Express error handling middleware (must be after routes)
app.use((err, req, res, next) => {
    console.error('Express error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
});


const InitalizeConnection = async ()=>{
    try{

        await main();
        console.log("DB Connected");

        // Ensure Mongo indexes reflect current schema (drops outdated unique indexes)
        try {
            const User = require('./models/user');
            await User.syncIndexes();
            console.log('User indexes synced');
        } catch (idxErr) {
            console.warn('Index sync warning:', idxErr.message);
        }

        // Try to connect to Redis, but don't block server startup
        try {
            await redisClient.connect();
            console.log("Redis Connected");
        } catch (rErr) {
            console.warn("Redis not connected:", rErr.message);
        }

        app.listen(process.env.PORT, ()=>{
            console.log("Server listening at port number: "+ process.env.PORT);
        })
        if(!process.env.JWT_KEY){
            console.warn('Warning: JWT_KEY is not set. Auth may fail.');
        }
        if(!process.env.PORT){
            console.warn('Warning: PORT is not defined in env.');
        }

    }
    catch(err){
        console.log("Error: "+err);
    }
}


InitalizeConnection();

