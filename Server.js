const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

const dbConfig = require("./config/dbConfig");
dbConfig();

const Users = mongoose.model("Users", {
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    unique: true,
  },
  expenses: [
    {
      date: Date,
      amount: Number,
      category: String,
      type: { type: String, enum: ["Income", "Expense"] },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

app.post("/register", async (req, res) => {
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

// Login User---
app.post("/login", async (req, res) => {
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

// Get expense for the week

// Helper function to get the start of the week (Monday)
function getMonday(d) {
  d = new Date();
  const day = d.getDay(),
    diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

app.get("/dashboard/weekly-expenses/:userId", async (req, res) => {
  const { userId } = req.params;
  const today = new Date();
  

  try {
    const startDate = getMonday(today);
    const endDate = new Date(today);
    console.log(startDate, endDate);

    const user = await Users.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const daysOfWeek = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    // Initialize expensesByDay with all days set to 0
    const expensesByDay = {}
    for (day of daysOfWeek){
      expensesByDay[day]=0
    }
    const weeklyExpenses = user.expenses.filter(
      (expense) => expense.date >= startDate && expense.date <= endDate
    );
    const expenseByCategory = {}
    for (const expense of weeklyExpenses) {
      const day = new Date(expense.date).toLocaleDateString("en-US", {
        weekday: "long",
      });
      const category = expense.category;
      if (!expenseByCategory[category]){
        expenseByCategory[category] = 0
      }
      
      expensesByDay[day] += expense.amount;
      expenseByCategory[category]+=expense.amount
    }

    const totalExpenseCategoryValueSum = Object.values(expenseByCategory).reduce((acc, value)=> (acc+value), 0)
    

    const mappedData = Object.entries(expenseByCategory).map(([key, value]) => ({
        type: key.toLowerCase(),
        value:value/totalExpenseCategoryValueSum*100,
      }));
    const formattedData = Object.keys(expensesByDay)
      .map((day) => ({
        day,
        expense: expensesByDay[day],
      }))
      .sort((a, b) => daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day));

      console.log(formattedData);

    res.status(200).json({ success: true, expenses: formattedData, category:mappedData, totExpense:totalExpenseCategoryValueSum });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//   add daily expenses-----
app.post("/dashboard/add-expense/:userId", async (req, res) => {
  const { date, amount, category, type } = req.body;
  const { userId } = req.params;

  try {
    const user = await Users.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Add the new expense
    user.expenses.push({ date, amount, category, type });
    await user.save();

    res
      .status(201)
      .json({ success: true, message: "Expense added successfully", user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding expense",
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log("Server Started");
});
