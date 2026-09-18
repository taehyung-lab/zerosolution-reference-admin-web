import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiError } from '../error'
import { client, readResponseHeader } from './client'
import { isPreAuthPath } from './credential'
import { unwrapEnvelope } from './envelope'
import { publishTerminalUnauthorized } from './incident'

/**
 * 생성된 endpoint 는 봉투 타입(`{ header?, data? }`)을 타입 인자로 넘긴다.
 * mutator 는 봉투를 벗겨 `data` 를 반환하므로, 반환 타입도 같이 벗겨야
 * 선언된 타입이 런타임과 일치한다. 이 매핑이 없으면 호출부는 봉투를 기대하지만
 * 실제로는 payload 를 받는 타입 거짓말이 된다.
 */
export type UnwrapEnvelope<T> = T extends { data?: infer D } ? Exclude<D, undefined> : T

function isJsonResponse(response: AxiosResponse<unknown>): boolean {
  const contentType = readResponseHeader(response, 'content-type')
  const mediaType = contentType?.split(';', 1)[0]?.trim().toLowerCase()
  return mediaType === 'application/json' || mediaType?.endsWith('+json') === true
}

/**
 * 봉투가 선언한 세션 만료는 HTTP 200 으로 도착하므로 응답 오류 인터셉터를 지나지 않는다.
 * `unwrapEnvelope` 은 순수 판정이라 이음매가 없으니, 봉투를 푸는 이 transport 경계가
 * terminal 처리를 소유한다. 여기서 발행하지 않으면 `error-outcome` 은 incident 로 판정하는데
 * `IncidentBoundary` 에는 아무 사실도 오지 않는다.
 *
 * pre-auth 요청(sign-in·2FA)은 제외한다. 아직 성립한 세션이 없으므로 그 실패는
 * 세션의 종료가 아니라 화면 안 오류다.
 */
function decodeResponse<T>(response: AxiosResponse<T>): UnwrapEnvelope<T>
function decodeResponse(response: AxiosResponse<unknown>): unknown {
  if (!isJsonResponse(response)) return response.data
  const requestId = readResponseHeader(response, 'x-request-id')
  try {
    return unwrapEnvelope(response.data, requestId)
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.kind === 'unauthorized' &&
      !isPreAuthPath(response.config.url)
    ) {
      publishTerminalUnauthorized('api', error)
    }
    throw error
  }
}

/**
 * Orval custom mutator. 생성된 endpoint 함수는 전부 이 함수를 통해 호출된다.
 *
 * - 생성 시그니처에 Authorization 을 노출하지 않는다 (scripts/openapi/prepare-generation.mjs 가
 *   스펙의 중복 parameter 를 제거하고, 실제 헤더는 client interceptor 가 붙인다).
 * - 응답 봉투 판정을 여기 한 곳에서 통과시킨다 (`api-wire.md` transport 경계).
 */
export const customInstance = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<UnwrapEnvelope<T>> => {
  const response = await client<T>({ ...config, ...options })
  return decodeResponse(response)
}

export default customInstance
