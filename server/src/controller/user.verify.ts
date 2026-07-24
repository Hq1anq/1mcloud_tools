import type { Request, Response } from "express";

export interface VerifyTokenRequestBody {
  token: string;
}

interface AuthenticatedRequest extends Request {
  token?: string;
}

if (!process.env.BASE_URL) {
  throw new Error("BASE_URL is not configured in environment variables");
}
const BASE_URL = process.env.BASE_URL;

export const requestVerifyEmail = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const url = `${BASE_URL}/user/verify`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json, text/plain, */*",
        authorization: `Bearer ${req.token}`,
      },
    });

    const rawData = await response.json();

    if (!response.ok) {
      const errorText = rawData.reason || rawData.error || "Request failed";
      return res.status(response.status).json({
        success: false,
        error: errorText,
      });
    }

    return res.json({
      success: true,
      data: rawData,
    });
  } catch (error) {
    const err = error as Error;
    console.log("❌ Error in requestVerifyEmail:", err.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const sendVerifyToken = async (
  req: Request<Record<string, never>, unknown, VerifyTokenRequestBody>,
  res: Response,
) => {
  const url = `${BASE_URL}/user/verify`;
  try {
    const { token } = req.body;

    const formData = new URLSearchParams({
      token: token,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    const rawData = await response.json();

    if (!response.ok) {
      const errorText = rawData.reason || rawData.error || "Verification failed";
      return res.status(response.status).json({
        success: false,
        error: errorText,
      });
    }

    return res.json({
      success: true,
      data: rawData,
    });
  } catch (error) {
    const err = error as Error;
    console.log("❌ Error in sendVerifyToken:", err.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
