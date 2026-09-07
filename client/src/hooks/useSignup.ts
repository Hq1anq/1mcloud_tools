import { useMutation } from '@tanstack/react-query'
import { signupApi } from '../api/authApi'
import type { SignupPayload, SignupResponse } from '../types/auth'

export function useSignupMutation() {
  return useMutation<SignupResponse, Error, SignupPayload>({
    mutationFn: (payload: SignupPayload) => signupApi(payload),
  })
}
