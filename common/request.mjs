import fetch, { Request } from 'node-fetch'

const BODY_SNIPPET_LENGTH = 160

const bodySnippet = (body) =>
  body.replace(/\s+/g, ' ').trim().slice(0, BODY_SNIPPET_LENGTH)

const request = async (options) => {
  const request = new Request(options.url, {
    timeout: 20000,
    ...options
  })
  const response = await fetch(request)

  // Parse the body as text so a non-JSON response (e.g. a GitHub edge HTML
  // interstitial) surfaces status + a body snippet instead of node-fetch's
  // opaque "invalid json response body" that hides whether the status was 2xx.
  const body = await response.text()
  let json
  try {
    json = JSON.parse(body)
  } catch {
    json = null
  }

  if (response.status >= 200 && response.status < 300) {
    if (json !== null) {
      return json
    }
    const error = new Error(
      `invalid json response body at ${options.url} (HTTP ${response.status}): ${bodySnippet(
        body
      )}`
    )
    error.nonJson = true
    error.status = response.status
    error.response = response
    throw error
  }

  const error = new Error(
    json
      ? json.error || json.message || response.statusText
      : `HTTP ${response.status} ${response.statusText} fetching ${options.url}: non-JSON body: ${bodySnippet(
          body
        )}`
  )
  error.nonJson = json === null
  error.status = response.status
  error.response = response
  throw error
}

export default request
