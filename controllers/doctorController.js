const { logActivity } = require("./controllerUtils.js");
const appointmentModel = require("../models/appointmentModel");
const doctorModel = require("../models/doctorModel");
const userModel = require("../models/userModel");

const getDoctorInfoController = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  try {
    const doctor = await doctorModel.findOne({ userId: req.body.userId });
    res.status(200).send({
      success: true,
      message: "Doctor Data Fetch Success",
      data: doctor,
    });
  } catch (error) {
    console.log(error);
    logActivity('ERROR: Fetch doctor data failed', ip, undefined, { requestBody: req.body });
    res.status(500).send({
      success: false,
      error,
      message: "Error in Fetching Doctor Details",
    });
  }
};

// update doc profile
const updateProfileController = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const user = await userModel.findOne({ _id: req.body.userId });

  try {
    const doctor = await doctorModel.findOneAndUpdate(
      { userId: req.body.userId },
      req.body
    );
    logActivity("SUCCESS: Doctor profile updated", ip, user, { doctor: doctor });
    res.status(201).send({
      success: true,
      message: "Doctor Profile Updated",
      data: doctor,
    });
  } catch (error) {
    console.log(error);
    logActivity("ERROR: Doctor profile update failed", ip, user, { requestBody: req.body });
    res.status(500).send({
      success: false,
      message: "Doctor Profile Update Issue",
      error,
    });
  }
};

//get single docotor
const getDoctorByIdController = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  try {
    const doctor = await doctorModel.findOne({ _id: req.body.doctorId });
    res.status(200).send({
      success: true,
      message: "Single Doctor Info Fetched",
      data: doctor,
    });
  } catch (error) {
    console.log(error);
    logActivity('ERROR: Fetch single doctor info failed', ip, undefined, { requestBody: req.body });
    res.status(500).send({
      success: false,
      error,
      message: "Error in Single Doctor Info",
    });
  }
};

const doctorAppointmentsController = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  try {
    const doctor = await doctorModel.findOne({ userId: req.body.userId });
    const appointments = await appointmentModel.find({
      doctorId: doctor._id,
    });
    res.status(200).send({
      success: true,
      message: "Doctor Appointments Fetch Successfully",
      data: appointments,
    });
  } catch (error) {
    console.log(error);
    logActivity('ERROR: Fetch doctor appointments data failed', ip, undefined, { requestBody: req.body });
    res.status(500).send({
      success: false,
      error,
      message: "Error In Doctor Appointments",
    });
  }
};

const updateStatusController = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  try {
    const { appointmentsId, status } = req.body;
    const appointments = await appointmentModel.findByIdAndUpdate(
      appointmentsId,
      { status }
    );
    const user = await userModel.findOne({ _id: appointments.userId });
    let notification = user.notification || []; // Initialize notifcation to an empty array if it's undefined
    notification.push({
      type: "status-updated",
      message: `Your Appointment Has Been Updated ${status}`,
      onCLickPath: "/doctor-appointments",
    });
    await userModel.updateOne(
      { _id: user._id },
      { $set: { notification: notification } }
    );
    logActivity("SUCCESS: Appointment status updated", ip, user, {appointments: appointments, appointmentId: appointmentsId, status: status});
    res.status(200).send({
      success: true,
      message: "Appointment Status Updated",
    });
  } catch (error) {
    console.log(error);
    logActivity("ERROR: Appointment status update failed", ip, undefined, { requestBody: req.body });
    res.status(500).send({
      success: false,
      error,
      message: "Error In Update Status",
    });
  }
};


module.exports = { getDoctorInfoController, updateProfileController, getDoctorByIdController, doctorAppointmentsController, updateStatusController };