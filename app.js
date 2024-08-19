const express = require("express");
const axios = require("axios");
const cors = require("cors");
const routeByRole = require("./components/routeByRole");
const SERVICE_ENDPOINTS = require("./components/serviceEndpoints");
const Email_Verification_ENDPOISNT = require("./components/emailVerification");
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

let role;
app.post("/signup", async (req, res) => {
  const { ...data } = req.body;
  role = data.role;
  try {
    let targetUrl = `${routeByRole(data.role)}/signup`;
    console.log("tartyeeeeeeee", targetUrl, "datgaa", data);

    const response = await axios.post(targetUrl, data);

    if (role == "user") {
      await axios.post("http://localhost:6000/admin-service/userDatas", data);
    } else {
      // await axios.post("http://localhost:6000/admin-service/doctorDatas", data);
    }

    res.status(200).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

app.post("/verify-otp", async (req, res) => {
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
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

const checkCredentials = async (email, password) => {
  console.log("user email is ", email, "and password is ", password);

  const serviceEndpoints = Object.values(SERVICE_ENDPOINTS);

  for (const endpoint of serviceEndpoints) {
    try {
      const response = await axios.post(endpoint, { email, password });
      console.log(response);
      if (response.status === 200) {
        return {
          success: true,
          user: response.data.user,
          service: endpoint,
          token: response.data.token,
        };
      }
    } catch (error) {
      console.error(
        `Error checking credentials with ${endpoint}:`,
        error.message
      );
    }
  }

  return { success: false };
};

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  console.log("Email is", email, "and pass is ", password);

  try {
    const result = await checkCredentials(email, password);
    console.log("Result is ", result);

    if (result.success) {
      res
        .status(200)
        .json({ success: true, user: result.user, token: result.token });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const checkEmail = async (email) => {
  console.log("user email is ", email);

  const serviceEndpoints = Object.values(Email_Verification_ENDPOISNT);

  for (const endpoint of serviceEndpoints) {
    try {
      const response = await axios.post(endpoint, { email });
      if (response.status === 200) {
        console.log("heelo");

        return {
          success: true,
        };
      }
    } catch (error) {
      console.error(
        `Error checking credentials with ${endpoint}:`,
        error.message
      );
    }
  }

  return { success: false };
};

app.post("/forgot-password", async (req, res) => {
  let email = req.body;
  let ExistsEmail = await checkEmail(email);
  console.log("111111", ExistsEmail.success);

  if (ExistsEmail.success) {
    return res.status(200).json({ message: "User found", email });
  }
  return res.status(400).json({ message: "User not found" });
});

app.listen(port, () => {
  console.log(`Routing service running on port ${port}`);
});
