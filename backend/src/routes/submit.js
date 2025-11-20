
const express = require('express');
const submitRouter = express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const {submitCode,runCode} = require("../controllers/userSubmission");

submitRouter.post("/submit/:id", userMiddleware, submitCode);
// Make run public so guests can try problems without login
submitRouter.post("/run/:id", runCode);

module.exports = submitRouter;
