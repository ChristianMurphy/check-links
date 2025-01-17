import pMap from 'p-map'
import pMemoize from 'p-memoize'

import { checkLink } from './check-link.js'

const isUrlAlive = pMemoize(checkLink, {
  maxAge: 60 * 1000
})

/**
 * Robustly checks an array of URLs for liveness.
 *
 * For each URL, it first attempts an HTTP HEAD request, and if that fails it will attempt
 * an HTTP GET request, retrying several times by default with exponential falloff.
 *
 * Returns a `Map<String, LivenessResult>` that maps each input URL to an object
 * containing `status` and possibly `statusCode`.
 *
 * `LivenessResult.status` will be one of the following:
 * - `alive` if the URL is reachable (2XX status code)
 * - `dead` if the URL is not reachable
 * - `invalid` if the URL was parsed as invalid or used an unsupported protocol
 *
 * `LivenessResult.statusCode` will contain an integer HTTP status code if that URL resolved
 * properly.
 *
 * @name checkLinks
 * @function
 *
 * @param {array<string>} urls - Array of urls to test
 * @param {object} [opts] - Optional configuration options (any extra options are passed to [got](https://github.com/sindresorhus/got#options))
 * @param {number} [opts.concurrency=8] - Maximum number of urls to resolve concurrently
 *
 * @return {Promise<LivenessResult>}
 */
export async function checkLinks(urls, opts = {}) {
  const concurrency = opts.concurrency || 8
  const results = {}

  await pMap(
    urls,
    async (url) => {
      const result = await isUrlAlive(url, opts)
      results[url] = result
    },
    {
      concurrency
    }
  )

  return results
}
