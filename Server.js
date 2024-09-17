const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

const dbConfig = require("./config/dbConfig");
const  authRouter  = require("./Routes/AuthRoutes");
const dashBoardRouter = require('./Routes/DashBoardRoutes')
const authoriseUser = require('./middlewares/Authmiddleware')
dbConfig();

app.use('/', authRouter)
app.use('/dashboard',  dashBoardRouter)




// app.get('/get-expenses', async(req, res)=>{
//   const user = await Users.updateOne({username:'Ram'}, { $pop:{expenses:1} })
//   console.log(user.expenses[user.expenses.length-1]);
//   res.send('done')
  
// });

// get portfolio status


app.listen(port, () => {
  console.log("Server Started");
});
