const express = require("express");
const router = express.Router();
const Users = require("../Modal/User");
const authoriseUser = require('../middlewares/Authmiddleware')

// helperfunction to find monday...

function getMonday(d) {
  d = new Date(d);
  const day = d.getDay(),
    diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

//   route to get the weekly expenses..
router.get("/weekly-expenses/:userId", authoriseUser, async (req, res) => {
  const { userId } = req.params;
  const { type } = req.query;
  const { date } = req.query;

  const today = new Date();

  try {
    const startDate = getMonday(date);
    const chDate = new Date(startDate);
    chDate.setDate(startDate.getDate() + 6);
    const endDate = chDate > new Date() ? new Date() : chDate;

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

    const weeklyExpenses = user.expenses.filter(
      (expense) =>
        expense.date >= startDate &&
        expense.date <= endDate &&
        expense.type == type
    );
    // Initialize expensesByDay with all days set to 0
    const expensesByDay = {};
    for (day of daysOfWeek) {
      expensesByDay[day] = 0;
    }
    const expenseByCategory = {};
    for (const expense of weeklyExpenses) {
      const day = new Date(expense.date).toLocaleDateString("en-US", {
        weekday: "long",
      });
      const category = expense.category;
      if (!expenseByCategory[category]) {
        expenseByCategory[category] = 0;
      }

      expensesByDay[day] += expense.amount;
      expenseByCategory[category] += expense.amount;
    }

    const totalExpenseCategoryValueSum = Object.values(
      expenseByCategory
    ).reduce((acc, value) => acc + value, 0);

    const mappedData = Object.entries(expenseByCategory).map(
      ([key, value]) => ({
        type: key.toLowerCase(),
        value: (value / totalExpenseCategoryValueSum) * 100,
      })
    );
    const formattedData = Object.keys(expensesByDay)
      .map((day) => ({
        day,
        expense: expensesByDay[day],
      }))
      .sort((a, b) => daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day));

    res.status(200).json({
      success: true,
      expenses: formattedData,
      category: mappedData,
      totExpense: totalExpenseCategoryValueSum,
      dateSpan: [
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0],
      ],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//   add daily expenses-----
router.post("/add-expense/:userId", async (req, res) => {
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

router.get("/status/:userId", async (req, res) => {
  const { userId } = req.params;
  const today = req.query.date;

  try {
    const user = await Users.findById(userId);

    const startDate = getMonday(today);
    // const Sunday = new Date()
    const chDate = new Date(startDate);
    chDate.setDate(startDate.getDate() + 6);
    const endDate = chDate > new Date() ? new Date() : chDate;

    if (!user) {
      res.json({ success: false, message: "User Not Found" });
    }
    console.log(startDate, endDate);
    const userIncome = user.expenses.filter(
      (expense) =>
        expense.type === "Income" &&
        expense.date >= startDate &&
        expense.date <= endDate
    );
    const userExpense = user.expenses.filter(
      (expense) =>
        expense.type === "Expense" &&
        expense.date >= startDate &&
        expense.date <= endDate
    );

    res.status(200).json({
      success: true,
      message: "Status Fetched",
      incomeData: userIncome,
      expenseData: userExpense,
      dateSpan: [
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0],
      ],
    });
  } catch (error) {}
});

module.exports = router;
