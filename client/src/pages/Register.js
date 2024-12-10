import { Form, Input, Checkbox, Button, message } from "antd";
import axios from "axios";
import React, { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { hideLoading, showLoading } from "../redux/features/alertSlice";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  // Handle CAPTCHA change
  const handleCaptchaChange = (value) => {
    setCaptchaVerified(!!value); // Set true if value exists, else false
  };

  // Submit for Register
  const submitHandler = async (values) => {
    if (!agreementAccepted) {
      message.error("You must agree to the terms and conditions to register.");
      return;
    }
    if (!captchaVerified) {
      message.error("Please complete the CAPTCHA verification.");
      return;
    }

    try {
      dispatch(showLoading());

      const { data } = await axios.post("/api/user/register", values);

      dispatch(hideLoading());

      if (data.success) {
        message.success("Registration Successful");
        navigate("/login");
      } else {
        // Display server validation errors or user-related messages
        message.error(data.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      dispatch(hideLoading());

      // Handle network or unexpected server errors
      if (error.response) {
        // Server responded with a status other than 2xx
        const errorMessage = error.response.data.message || "Server Error";
        message.error(errorMessage);
      } else if (error.request) {
        // Request made but no response received
        message.error("Network Error: Unable to reach the server.");
      } else {
        // Error during request setup
        message.error(`Error: ${error.message}`);
      }
    }
  };

  return (
    <div className="register-page">
      <Form
        layout="vertical"
        onFinish={submitHandler}
        onFinishFailed={() => {
          message.error("Please fix the errors in the form before submitting.");
        }}
      >
        <h1>Register</h1>
        <Form.Item
          label="Name"
          name="name"
          rules={[
            { required: true, message: "Please input your name!" },
            { min: 3, message: "Name must be at least 3 characters" },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please input your email!" },
            { type: "email", message: "Invalid email format!" },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: "Please input your password!" },
            { min: 8, message: "Password must be at least 8 characters" },
            {
              pattern:
                /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\\[\]{};':"\\|,.<>\\/?])/,
              message:
                "Password must include uppercase, lowercase, number, and special character.",
            },
          ]}
        >
          <Input.Password />
        </Form.Item>

        {/* User Agreement Checkbox with Hyperlink */}
        <Form.Item>
          <Checkbox
            checked={agreementAccepted}
            onChange={(e) => setAgreementAccepted(e.target.checked)}
          >
            I accept the{" "}
            {/* <a
              href="/api/user/terms-and-conditions" // Change this URL to your terms document
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms and Conditions
            </a> */}
            {/* <Link to={"/api/user/terms-and-conditions"}>Terms and Conditions</Link> */}
            <Link to="/terms-and-conditions">Terms and Conditions</Link>
          </Checkbox>
        </Form.Item>

        {/* CAPTCHA Component */}
        <div style={{ marginBottom: "20px" }}>
          <ReCAPTCHA
            sitekey="6LcTL5MqAAAAAM2Nyieegy4QRva1nqZp13J3vSY4" // Your site key
            onChange={handleCaptchaChange}
          />
        </div>

        {/* Submit Button */}
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            disabled={!captchaVerified || !agreementAccepted}
          >
            Register
          </Button>
        </Form.Item>

        <div className="d-flex justify-content-between">
          <Link to="/login">Already Registered? Click Here to Login</Link>
        </div>
      </Form>
    </div>
  );
};

export default Register;
