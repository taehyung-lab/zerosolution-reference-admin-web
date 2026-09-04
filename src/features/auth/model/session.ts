export interface Session {
  readonly accessToken: string
  readonly requirePasswordChange: boolean
}

export interface SignInResponse {
  readonly accessToken?: string
  readonly requirePasswordChange?: boolean
}

export function toSession(response: SignInResponse): Session {
  if (response.accessToken === undefined || response.accessToken === '') {
    throw new Error('sign-in response is missing accessToken')
  }
  return {
    accessToken: response.accessToken,
    requirePasswordChange: response.requirePasswordChange === true,
  }
}
