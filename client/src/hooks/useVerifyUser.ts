import { useMutation } from '@tanstack/react-query'
import { requestVerifyEmailApi, sendVerifyTokenApi } from '../api/verifyApi'
import type { SendVerifyTokenPayload, VerifyUserResponse } from '../types/verify'

export function useRequestVerifyEmailMutation() {
  return useMutation<VerifyUserResponse, Error, void>({
    mutationFn: () => requestVerifyEmailApi(),
  })
}

export function useSendVerifyTokenMutation() {
  return useMutation<VerifyUserResponse, Error, SendVerifyTokenPayload>({
    mutationFn: (payload: SendVerifyTokenPayload) => sendVerifyTokenApi(payload),
  })
}
