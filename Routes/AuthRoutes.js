const express = require('express')
const router = express.Router()
const Users = require('../Modal/User')
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// login
router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const userExist = await Users.findOne({ email: email });
      if (userExist) {
        const passCompare = await bcrypt.compare(password, userExist.password);
        if (passCompare) {
          const data = { user: { id: userExist.id } };
          const token = jwt.sign(data, "finance_user");
          res.send({ success: true, token, userId: userExist.id });
        } else {
          res.json({ success: false, message: "Wrong Password" });
        }
      } else {
        res.json({ success: false, message: "wrong email" });
      }
    } catch (error) {
      console.log("error occured", error);
    }
  });

  // Register

  router.post("/register", async (req, res) => {
    try {
      
      const { username, email, password } = req.body;
      const userExist = await Users.findOne({ email: email });
      if (userExist) {
        return res.status(400).send("Email already registered");
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = new Users({ username, email, password: hashedPassword });
      await newUser.save();
      const data = {
        user: { id: newUser.id },
      };
      const token = jwt.sign(data, "finance_user");
  
      return res.status(201).json({
        message: "User Created succesfully",
        success: true,
        token,
        userId: newUser.id,
      });
    } catch (error) {
      return res.status(400).send(`Error registering user: ${error.message}`);
    }
  });
  


module.exports = router
