import { getPool } from "../lib/db.js";

export const login = async (req, res) => {
  if (!process.env.CLIENT_ID) {
    throw new Error("CLIENT_ID is not configured in environment variables");
  }
  if (!process.env.BASE_URL) {
    throw new Error("BASE_URL is not configured in environment variables");
  }
  const url = `${process.env.BASE_URL}/token`;
  try {
    const { email, password } = req.body;
    const headers = {
      accept: "application/json, text/plain, */*",
      "content-type": "application/x-www-form-urlencoded",
    };

    const formData = new URLSearchParams({
      email: email,
      password: password,
      client_id: process.env.CLIENT_ID,
      grant_type: "password",
    });

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    const rawData = await response.json();

    if (!response.ok) {
      const errorText = rawData.reason || rawData.error || "Unknown error";
      console.log("❌ Request failed:", response.status, errorText);
      return res.status(response.status).json({
        success: false,
        error: errorText || "Request failed",
      });
    }

    const token = rawData.access_token;

    // Fetch phone from /user/profile using the new token
    let phone = null;
    try {
      const profileRes = await fetch(`${process.env.BASE_URL}/user/profile`, {
        method: "GET",
        headers: {
          accept: "application/json, text/plain, */*",
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        phone = profileData.phone || null;
      }
    } catch (err) {
      console.log("⚠️ Failed to fetch profile for phone:", err.message);
    }

    // Upsert user into Users table (email + phone)
    try {
      const pool = await getPool();
      await pool
        .request()
        .input("email", email)
        .input("phone", phone)
        .query(
          `IF NOT EXISTS (SELECT 1 FROM Users WHERE email = @email)
             INSERT INTO Users (email, phone) VALUES (@email, @phone)
           ELSE
             UPDATE Users SET phone = @phone WHERE email = @email`,
        );
    } catch (err) {
      console.log("⚠️ Failed to upsert user:", err.message);
    }

    return res.json({
      success: true,
      token,
      user: rawData.user,
    });
  } catch (error) {
    console.log("❌ Error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const getProfile = async (req, res) => {
  const url = `${process.env.BASE_URL}/user/profile`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/json",
        authorization: `Bearer ${req.headers.authorization}`,
      },
    });

    const rawData = await response.json();

    if (!response.ok) {
      const errorText = rawData.reason || rawData.error || "Unknown error";
      console.log("❌ Request failed:", response.status, errorText);
      return res.status(response.status).json({
        success: false,
        error: errorText || "Request failed",
      });
    }

    return res.json({
      success: true,
      user: rawData,
    });
  } catch (error) {
    console.log("❌ Error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
