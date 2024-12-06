const bcrypt = require("bcryptjs");
const userModel = require('../models/userModel');
const doctorModel = require("../models/doctorModel");
const appointmentModel = require("../models/appointmentModel");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const { logActivity } = require("./controllerUtils.js");
const MAX_ATTEMPTS = 5;
// 30 minute duration (1000ms * 60s * 30m)
const LOCK_DURATION = 30 * 60 * 1000;

// login callback
const loginController = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      logActivity("ACTIVITY: User not found", ip, { email: email}, undefined);
      return res.status(404).send('User Not Found');
    }

    // Check if the account is locked
    if (user.isLocked && user.lockUntil > Date.now()) {
      logActivity("ACTIVITY: Locked account login attempt", ip, user, undefined);
      return res.status(403).send(`Account is locked. Please try again in ${Math.ceil((user.lockUntil - Date.now()) / 1000 / 60)} minutes.`);
    }

    // Compare hashed password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      // Increment failed attempts
      user.failedLoginAttempts += 1;
      logActivity("ACTIVITY: Incorrect password attempt", ip, user, { attemptsRemaining: MAX_ATTEMPTS - user.failedLoginAttempts});

      // Lock account if max attempts reached
      if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
        logActivity("ACTIVITY: Account locked due to maxiumum login attempts", ip, user, { attemptsRemaining: 0 });
        user.isLocked = true;
        user.lockUntil = Date.now() + LOCK_DURATION;
      }
      // Save the user data
      await user.save();

      return res.status(401).send(`Invalid password. ${MAX_ATTEMPTS - user.failedLoginAttempts} attempts remaining.`);
    }

    // Reset login attempts on success
    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lockUntil = null;
    await user.save();

    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET,{expiresIn:"1d"},);
    logActivity("SUCCESS: Login", ip, user, undefined);
    res.status(200).send({ message: "Login Success", success: true, token });
  } catch (error) {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    console.log(error);
    console.log(process.env.JWT_SECRET);
    logActivity("ERROR: Login CTRL", ip, user, { requestBody: req.body });
    res.status(500).send({ message: `Error in Login CTRL ${error.message}` });
  }
};

//Register Callback
const registerController = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  try {
    const { name, email, password } = req.body;

    // Hash and salt password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
    });
    await newUser.save();
    const user = await userModel.findOne({ email });

    logActivity("SUCCESS: Account created", ip, user, undefined);
    res.status(201).json({
      success: true,
      newUser,
    });
  } catch (error) {
    logActivity("ERROR: Account creation failed", ip, undefined, { requestBody: req.body });
    res.status(400).json({
      success: false,
      error,
    });
  }
};

const authController = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  try {
    const user = await userModel.findById(req.body.userId);
    if (!user) {
      return res.status(200).send({
        message: "user not found",
        success: false,
      });
    } else {
      user.password = undefined; // move this line here
      res.status(200).send({
        success: true,
        data: user,
      });
    }
  } catch (error) {
    console.log(error);
    logActivity('ERROR: Fetch user data failed', ip, undefined, { requestBody: req.body });
    res.status(500).send({
      message: "auth error",
      success: false,
      error,
    });
  }
};

// Appply Doctor Controller
const applyDoctorController = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const user = await userModel.findOne({ _id: req.body.userId });

  try {
    const newDoctor = await doctorModel({ ...req.body, status: "pending" });
    await newDoctor.save();
    const adminUser = await userModel.findOne({ isAdmin: true });
    const notification = adminUser.notification;
    notification.push({
      type: "apply-doctor-request",
      message: `${newDoctor.firstName} ${newDoctor.lastName} Has Applied For A Doctor Account`,
      data: {
        doctorId: newDoctor._id,
        name: newDoctor.firstName + " " + newDoctor.lastName,
        onClickPath: "/admin/doctors",
      },
    });
    await userModel.findByIdAndUpdate(adminUser._id, { notification });
    logActivity("SUCCESS: Doctor application", ip, user, undefined);
    res.status(201).send({
      success: true,
      message: "Doctor Account Applied Successfully",
    });
  } catch (error) {
    console.log(error);
    logActivity("ERROR: Doctor application failed", ip, user, { requestBody: req.body });
    res.status(500).send({
      success: false,
      error,
      message: "Error While Applying For Doctor",
    });
  }
};

// Notification controller
const getAllNotificationController = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const user = await userModel.findOne({ _id: req.body.userId });

  try {
    const seennotification = user.seennotification;
    const notification = user.notification;
    seennotification.push(...notification);
    user.notification = [];
    user.seennotification = notification;
    const updatedUser = await user.save();
    logActivity("SUCCESS: Notifications marked as read", ip, user, undefined);
    res.status(200).send({
      success: true,
      message: "All Notifications Marked As Read",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    logActivity("ERROR: Mark notifications as read failed", ip, user, { requestBody: req.body });
    res.status(500).send({
      message: "Error In Notification",
      success: false,
      error,
    });
  }
};

// delete notifications
const deleteAllNotificationController = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const user = await userModel.findOne({ _id: req.body.userId });

  try {
    user.notification = [];
    user.seennotification = [];
    const updatedUser = await user.save();
    updatedUser.password = undefined;
    logActivity("SUCCESS: Notifications deleted", ip, user, undefined);
    res.status(200).send({
      success: true,
      message: "Notifications Deleted Successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    logActivity("ERROR: Delete notifications failed", ip, user, { requestBody: req.body });
    res.status(500).send({
      success: false,
      message: "Unable To Delete All Notifications",
      error,
    });
  }
};

//GET ALL DOC
const getAllDocotrsController = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  try {
    const doctors = await doctorModel.find({ status: "approved" });
    res.status(200).send({
      success: true,
      message: "Doctors Lists Fetched Successfully",
      data: doctors,
    });
  } catch (error) {
    console.log(error);
    logActivity('ERROR: Fetch doctors list failed', ip, undefined, { requestBody: req.body });
    res.status(500).send({
      success: false,
      error,
      message: "Error While Fetching Doctor",
    });
  }
};

// Checking Availability 
const bookingAvailabilityController = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  try {
    const date = moment(req.body.date, "DD-MM-YYYY").toISOString();
    const startTime = moment(req.body.time, "HH:mm").toISOString();
    const doctorId = req.body.doctorId;
    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).send({
        message: "Doctor not found",
        success: false,
      });
    }
    const start = moment(doctor.starttime, "HH:mm").toISOString();
    const end = moment(doctor.endtime, "HH:mm").toISOString();
    if (!moment(startTime).isBetween(start, end, undefined, "[]")) {
      return res.status(200).send({
        message: "Appointment Not Available",
        success: false,
      });
    }
    const appointments = await appointmentModel.find({
      doctorId,
      date,
      time: startTime,
    });
    if (appointments.length > 0) {
      return res.status(200).send({
        message: "Appointment Not Available",
        success: false,
      });
    }
    return res.status(200).send({
      success: true,
      message: "Appointment Available",
    });
  } catch (error) {
    console.log(error);
    logActivity('ERROR: Check appointment availability failed', ip, undefined, { requestBody: req.body });
    res.status(500).send({
      success: false,
      error,
      message: "Error Checking Appointment Availability",
    });
  }
};


//BOOK APPOINTMENT
/*const bookAppointmentController = async (req, res) => {
  try {
    const date = moment(req.body.date, "DD-MM-YYYY").toISOString();
    const startTime = moment(req.body.time, "HH:mm").toISOString();
    const doctorId = req.body.doctorId;
    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).send({
        message: "Doctor not found",
        success: false,
      });
    }
    const start = moment(doctor.starttime, "HH:mm").toISOString();
    const end = moment(doctor.endtime, "HH:mm").toISOString();
    if (!moment(startTime).isBetween(start, end, undefined, "[]")) {
      return res.status(400).send({
        message: "Selected time is not within doctor's available range",
        success: false,
      });
    }
    const appointments = await appointmentModel.find({
      doctorId,
      date,
    });
    if (appointments.length >= doctor.maxPatientsPerDay) {
      return res.status(400).send({
        message: "Maximum number of appointments reached for this day",
        success: false,
      });
    }
    const newAppointment = new appointmentModel({
      doctorId,
      userId: req.body.userId,
      date,
      time: startTime,
      doctorInfo: req.body.doctorInfo,
      userInfo: req.body.userInfo,
    });
    await newAppointment.save();
    return res.status(200).send({
      success: true,
      message: "Appointment Booked Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error In Booking Appointment",
    });
  }
};*/

const bookAppointmentController = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const user = await userModel.findOne({ _id: req.body.userId });

  try {
    const date = moment(req.body.date, "DD-MM-YYYY").toISOString();
    const startTime = moment(req.body.time, "HH:mm").toISOString();
    const doctorId = req.body.doctorId;
    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).send({
        message: "Doctor Not Found",
        success: false,
      });
    }
    const start = moment(doctor.starttime, "HH:mm").toISOString();
    const end = moment(doctor.endtime, "HH:mm").toISOString();
    if (!moment(startTime).isBetween(start, end, undefined, "[]")) {
      logActivity("ACTIVITY: Appointment not made, doctor not available at chosen time", ip, user, { requestBody: req.body, doctor: doctor });
      return res.status(400).send({
        message: "Selected Time Is Not Within Doctor's Available Range",
        success: false,
      });
    }
    const appointments = await appointmentModel.find({
      doctorId,
      date,
      status: "approved"
    });
    if (appointments.length >= doctor.maxPatientsPerDay) {
      logActivity("ACTIVITY: Appointment not made, max doctor's appointments reached for this day", ip, user, { requestBody: req.body, doctor: doctor });
      return res.status(400).send({
        message: "Maximum Number Of Appointments Reached For This Day",
        success: false,
      });
    }
    const existingAppointment = await appointmentModel.findOne({
      doctorId,
      date,
      time: startTime,
      status: "approved"
    });
    if (existingAppointment) {
      logActivity("ACTIVITY: Appointment not made, doctor has appointment at chosen time", ip, user, { requestBody: req.body, doctor: doctor });
      return res.status(400).send({
        message: "Appointment Already Booked For This Time Slot",
        success: false,
      });
    }
    const newAppointment = new appointmentModel({
      doctorId,
      userId: req.body.userId,
      date,
      time: startTime,
      doctorInfo: req.body.doctorInfo,
      userInfo: req.body.userInfo,
    });
    await newAppointment.save();
    logActivity("SUCCESS: Appointment created", ip, user, { requestBody: req.body, doctor: doctor });
    return res.status(200).send({
      success: true,
      message: "Appointment Booked Successfully",
    });
  } catch (error) {
    console.log(error);
    logActivity("ERROR: Appointment creation failed", ip, user, { requestBody: req.body, doctor: doctor });
    res.status(500).send({
      success: false,
      error,
      message: "Error In Booking Appointment",
    });
  }
};

const userAppointmentsController = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  try {
    const appointments = await appointmentModel.find({
      userId: req.body.userId,
    });
    res.status(200).send({
      success: true,
      message: "Users Appointments Fetch Successfully",
      data: appointments,
    });
  } catch (error) {
    console.log(error);
    logActivity('ERROR: Fetch appointments failed', ip, undefined, { requestBody: req.body });
    res.status(500).send({
      success: false,
      error,
      message: "Error In User Appointments",
    });
  }
};

module.exports = { loginController, registerController, authController , applyDoctorController, getAllNotificationController, deleteAllNotificationController, getAllDocotrsController, bookAppointmentController, bookingAvailabilityController, userAppointmentsController};