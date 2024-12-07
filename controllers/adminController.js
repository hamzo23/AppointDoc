const { logActivity } = require("./controllerUtils.js");
const doctorModel = require('../models/doctorModel');
const userModel = require("../models/userModel");


const getAllUsersController = async (req, res) => {
  try {
    const users = await userModel.find({});
    res.status(200).send({
      success: true,
      message: "Users Data List",
      data: users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Fetching Users",
      error,
    });
  }
};

//GET ALL DOC
const getAllDoctorsController = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  try {
    const doctors = await doctorModel.find({});
    res.status(200).send({
      success: true,
      message: "Doctors Data list",
      data: doctors,
    });
  } catch (error) {
    console.log(error);
    logActivity('ERROR: Fetch doctor data list failed', ip, undefined, { requestBody: req.body });
    res.status(500).send({
      success: false,
      message: "Error While Getting Doctors Data",
      error,
    });
  }
};


// doctor account status
const changeAccountStatusController = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  try {
    const { doctorId, status } = req.body;
    const doctor = await doctorModel.findByIdAndUpdate(doctorId, { status });
    const user = await userModel.findOne({ _id: doctor.userId });
    const notification = user.notification;
    notification.push({
      type: "doctor-account-request-updated",
      message: `Your Doctor Account Request Has ${status} `,
      onClickPath: "/notification",
    });
    user.isDoctor = status === "approved" ? true : false;
    const message = status === "approved" ? "approved" : "rejected";
    logActivity(`SUCCESS: Doctor status ${message}`, ip, user, { doctor: doctor });
    await user.save();
    res.status(201).send({
      success: true,
      message: "Account Status Updated",
      data: doctor,
    });
  } catch (error) {
    console.log(error);
    logActivity('ERROR: Doctor status update failed', ip, undefined, { requestBody: req.body });
    res.status(500).send({
      success: false,
      message: "Error In Account Status",
      error,
    });
  }
};


module.exports = { getAllDoctorsController, getAllUsersController, changeAccountStatusController };