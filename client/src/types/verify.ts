export interface SendVerifyTokenPayload {
  token: string
}

export interface VerifyUserResponse {
  success: boolean
  message?: string
  error?: string
}
