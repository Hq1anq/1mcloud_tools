import type { Request, Response } from "express";
import { getPool } from "../lib/db.js";

export interface SignupRequestBody {
  fullname: string;
  email: string;
  phone: string;
  password: string;
  ref_code?: string;
  partner?: string;
}

if (!process.env.CLIENT_ID) {
  throw new Error("CLIENT_ID is not configured in environment variables");
}
if (!process.env.BASE_URL) {
  throw new Error("BASE_URL is not configured in environment variables");
}

const CLIENT_ID = process.env.CLIENT_ID;
const BASE_URL = process.env.BASE_URL;

export const signup = async (
  req: Request<Record<string, never>, unknown, SignupRequestBody>,
  res: Response,
) => {
  const url = `${BASE_URL}/user/register`;

  try {
    const { fullname, email, phone, password, ref_code, partner } = req.body;

    const partnerValue = partner || req.hostname;
    const refCodeValue = ref_code || "";

    const formData = new URLSearchParams({
      username: fullname,
      email: email,
      phone: phone,
      password: password,
      grant_type: "password",
      client_id: CLIENT_ID,
      partner: partnerValue,
      ref_code: refCodeValue,
    });

    console.log("========request========");
    console.log(url, formData);
    console.log("========================");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    const rawData = await response.json();

    console.log("========response========");
    console.log(JSON.stringify(rawData, null, 2));
    console.log("========================");

    if (!response.ok) {
      const errorText = rawData.reason || rawData.error || "Signup failed";
      console.log("❌ Signup request failed:", response.status, errorText);
      return res.status(response.status).json({
        success: false,
        error: errorText,
      });
    }

    // Upsert user into MSSQL database Users table
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
      const dbErr = err as Error;
      console.log("⚠️ Failed to upsert user in MSSQL:", dbErr.message);
    }

    return res.json({
      success: true,
      user: rawData.user || rawData,
    });
  } catch (error) {
    const err = error as Error;
    console.log("❌ Error during signup:", err.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
