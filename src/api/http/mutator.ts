import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { client, readResponseHeader } from './client'
import { unwrapEnvelope } from './envelope'

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

function decodeResponse<T>(response: AxiosResponse<T>): UnwrapEnvelope<T>
function decodeResponse(response: AxiosResponse<unknown>): unknown {
  if (!isJsonResponse(response)) return response.data
  const requestId = readResponseHeader(response, 'x-request-id')
  return unwrapEnvelope(response.data, requestId)
}

/**
 * Orval custom mutator. 생성된 endpoint 함수는 전부 이 함수를 통해 호출된다.
 *
 * - 생성 시그니처에 Authorization 을 노출하지 않는다 (scripts/openapi/prepare-generation.mjs 가
 *   스펙의 중복 parameter 를 제거하고, 실제 헤더는 client interceptor 가 붙인다).
 * - 응답 봉투 판정을 여기 한 곳에서 통과시킨다 (`api-contract` transport 경계).
 */
export const customInstance = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<UnwrapEnvelope<T>> => {
  const response = await client<T>({ ...config, ...options })
  return decodeResponse(response)
}

export default customInstance
