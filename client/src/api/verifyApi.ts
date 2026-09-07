import axiosInstance from '../lib/axios'
import type { SendVerifyTokenPayload, VerifyUserResponse } from '../types/verify'

export async function requestVerifyEmailApi(): Promise<VerifyUserResponse> {
  const response = await axiosInstance.get<VerifyUserResponse>('/user/verify')
  return response.data
}

export async function sendVerifyTokenApi(
  payload: SendVerifyTokenPayload
): Promise<VerifyUserResponse> {
  const response = await axiosInstance.post<VerifyUserResponse>('/user/verify', payload)
  return response.data
}
