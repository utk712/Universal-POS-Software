const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const { verifyToken } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", customerController.getAllCustomers);
router.post("/", customerController.addCustomer);
router.get("/:id", customerController.getCustomerDetails);
router.post("/pay-khata", customerController.collectKhataPayment);

module.exports = router;
