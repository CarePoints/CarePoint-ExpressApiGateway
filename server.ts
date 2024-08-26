import { Request, Response } from "express";

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const routeByRole = require("./Api/routeByRole");
const SERVICE_ENDPOINTS = require("./Api/serviceEndpoints");
const Email_Verification_ENDPOISNT = require("./Api/emailVerification");
const app = express();
const port = process.env.PORT || 7000;

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

let role:  string | undefined;
app.post("/signup", async (req:Request, res:Response) => {
  const { ...data } = req.body;
  role = data.role;
  try {
    let targetUrl = `${routeByRole(data.role)}/signup`;

    const response = await axios.post(targetUrl, data);

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/verify-otp", async (req:Request, res:Response) => {
  const { otp, email } = req.body;

  try {
    let targetUrl = `${routeByRole(role)}/verify-otp`;
    const response = await axios.post(targetUrl, { otp });

    if (role == "user") {
      await axios.post(
        "http://localhost:6000/admin-service/userDatasVerified",
        { message: "Verified", email: email }
      );
    }

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const checkCredentials = async (email:string, password:string) => {
  const serviceEndpoints = Object.values(SERVICE_ENDPOINTS);

  for (const endpoint of serviceEndpoints) {
    try {
      const response = await axios.post(endpoint, { email, password });
      if (response.data.error) {
        return response.data;
      } else {
        return {
          success: true,
          user: response.data.user,
          service: endpoint,
          token: response.data.token,
        };
      }
    } catch (error) {
      console.error(
        `Error checking credentials with ${endpoint}:`
      );
    }
  }

  return { success: false };
};

app.post("/login", async (req:Request, res:Response) => {
  const { email, password } = req.body;

  try {
    const result = await checkCredentials(email, password);
    if (result.success) {
      res
        .status(200)
        .json({ success: true, user: result.user, token: result.token });
    } else if (result.error) {
      res.json({ success: false, result });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

const checkEmail = async (email:string) => {
  const serviceEndpoints = Object.values(Email_Verification_ENDPOISNT);

  for (const endpoint of serviceEndpoints) {
    try {
      const response = await axios.post(endpoint, { email });
      if (response.status === 200) {
        return {
          success: true,
          endpoint,
        };
      }
    } catch (error) {
      console.error(
        `Error checking credentials with ${endpoint}:`
      );
    }
  }

  return { success: false };
};

app.post("/forgot-password", async (req:Request, res:Response) => {
  let email = req.body;

  let ExistsEmail = await checkEmail(email);

  if (ExistsEmail.success) {
    return res.status(200).json({ message: "User found", email });
  }
  return res.status(400).json({ message: "User not found" });
});

app.post("/resetPassword", async (req:Request, res:Response) => {
  console.log("reqwww", req.body);
  const { email, password } = req.body;
  const userResetPassword = await axios.post(
    "http://localhost:4000/user-service/resetPassword",
    { email, password }
  );

  if (userResetPassword.status == 200) {
    return res
      .status(200)
      .json({ success: true, message: "Password rested Successfully" });
  }
  return res
    .status(500)
    .json({ success: false, message: "Failed to reset password" });
});

app.listen(port, () => {
  console.log(`Routing service running on port ${port}`);
});
