export interface SignupPayload {
  fullname: string
  email: string
  phone: string
  password: string
  ref_code?: string
  partner?: string
}

export interface UserRegisterInfo {
  id: number
  username: string
  email: string
}

export interface SignupResponse {
  success: boolean
  user?: UserRegisterInfo
  error?: string
}
