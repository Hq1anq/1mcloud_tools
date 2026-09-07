import axiosInstance from '../lib/axios'
import type { SignupPayload, SignupResponse } from '../types/auth'

export async function signupApi(payload: SignupPayload): Promise<SignupResponse> {
  const response = await axiosInstance.post<SignupResponse>('/auth/signup', payload)
  return response.data
}
