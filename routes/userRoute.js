const express = require("express");
const {
  loginController,
  verify2FAController,
  registerController,
  authController,
  applyDoctorController,
  getAllNotificationController,
  deleteAllNotificationController,
  getAllDocotrsController,
  bookAppointmentController,
  bookingAvailabilityController,
  userAppointmentsController,
  getTermsAndConditions
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
// const termscontroller = require("../controllers/termscontroller");


//router object
const router = express.Router();

//routes
// POST || LOGIN USER
router.post("/login", loginController);

// POST || VERIFY 2FA CODE
router.post("/verify-2fa", verify2FAController);

//POST || REGISTER USER
router.post("/register", registerController);

//Auth || POST
router.post("/getUserData", authMiddleware, authController);

//Apply Doctor || POST
router.post("/apply-doctor", authMiddleware, applyDoctorController);

//Notifiaction  Doctor || POST
router.post("/get-all-notification", authMiddleware, getAllNotificationController);

//Notifiaction  Doctor || POST
router.post("/delete-all-notification", authMiddleware, deleteAllNotificationController);

//GET ALL DOC
router.get("/getAllDoctors", authMiddleware, getAllDocotrsController);

//BOOK APPOINTMENT
router.post("/book-appointment", authMiddleware, bookAppointmentController);

//Booking Avliability
router.post("/booking-availbility", authMiddleware, bookingAvailabilityController);

//Appointments List
router.get("/user-appointments", authMiddleware, userAppointmentsController);

router.get("/terms-and-conditions", getTermsAndConditions);

module.exports = router;