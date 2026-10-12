const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");
const { verifyToken } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", expenseController.getAllExpenses);
router.post("/", expenseController.addExpense);
router.delete("/:id", expenseController.deleteExpense);

module.exports = router;

