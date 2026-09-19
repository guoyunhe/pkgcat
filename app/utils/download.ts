import { Agent, get as httpGet, type IncomingMessage } from 'node:http'
import { Agent as HttpsAgent, get as httpsGet } from 'node:https'
import type { Readable } from 'node:stream'

import { collectChunks } from '#utils/streams'

/**
 * Files of a repository are read with the plain `node:http` client instead of a fetch based one.
 * The metadata of an application sits in the first kilobytes of its package, so the rest of a
 * package of up to hundreds of megabytes is dropped as soon as it has been read: fetching through
 * undici — which is what `xior` does — leaves the HTTP/1 parser of a body nobody reads paused, and
 * crashes the whole process with an assertion that cannot be caught when the server then closes the
 * connection (`nodejs/undici#5360`, in undici 7, which Node 24.17 and 24.18 ship). The socket of a
 * `node:http` response is simply destroyed instead.
 */

/** Headers a repository is asked for one of its files with. */
const requestHeaders = { Accept: '*/*', 'User-Agent': 'curl/8.0' }

/** Redirects a download follows, which is how Fedora hands a file over to a mirror of its own. */
const maxRedirects = 5

/**
 * Time a socket is given to reach a mirror. A host whose address is not answering at all leaves the
 * socket connecting, which only the operating system bounds — after minutes — so the timer does.
 */
const connectTimeout = 30_000

/**
 * Time a server is given to answer, and time between two chunks of a file once it does: a mirror is
 * slow to serve a package, so the budget is the one the fetch client this replaces gave them, while
 * a server that has stopped answering fails the download instead of hanging the run that reads it.
 */
const downloadTimeout = 5 * 60_000

/**
 * Connections are held for the next file of the same repository, by agents of our own: the default
 * agent times an idle socket out after five seconds, which is shorter than the pause a mirror takes
 * before it serves the next file of a repository.
 */
const agents = new Map<string, Agent>([
  ['http:', new Agent({ keepAlive: true, timeout: downloadTimeout })],
  ['https:', new HttpsAgent({ keepAlive: true, timeout: downloadTimeout })],
])

/** Failure of a download, reported the way the synchronization names it. */
class DownloadError extends Error {
  /** Status of the answer, or `null` when the request was left without one. */
  readonly status: number | null

  constructor(url: string, status: number | null, cause?: unknown) {
    super(`Unable to download ${url}${status ? ` (${status})` : ''}`, { cause })
    this.status = status
  }
}

export type DownloadOptions = { optional?: boolean }

/**
 * Read a file of a repository into memory. A file a repository does not publish is `null` when
 * `optional` is set, which is how the metadata repositories only some of them carry is asked for.
 */
export async function download(url: string): Promise<Buffer>
export async function download(url: string, options: { optional: true }): Promise<Buffer | null>
export async function download(url: string, options: DownloadOptions = {}): Promise<Buffer | null> {
  return answerTwice(url, () => readFile(url, options))
}

async function readFile(url: string, options: DownloadOptions): Promise<Buffer | null> {
  const response = await openResponse(url)
  const status = response.statusCode ?? 0

  // A path a repository does not have is answered with 404, or with 410 when it was removed
  if (options.optional && (status === 404 || status === 410)) {
    response.resume()
    return null
  }

  if (status < 200 || status >= 300) {
    response.destroy()
    throw new DownloadError(url, status)
  }

  return await collectChunks(response)
}

/**
 * Read a file of a repository as it arrives, which is how a package is read: neither it nor its
 * payload fits in memory. The stream is the response itself, so the caller destroys it to drop the
 * rest of a file whose metadata has been found.
 */
export async function downloadStream(url: string): Promise<Readable> {
  return answerTwice(url, () => openStream(url))
}

async function openStream(url: string): Promise<Readable> {
  const response = await openResponse(url)
  const status = response.statusCode ?? 0
  if (status < 200 || status >= 300) {
    response.destroy()
    throw new DownloadError(url, status)
  }

  return response
}

/**
 * Answer a request, asking once more when it was left without an answer: the connection was
 * dropped, the address did not resolve, or a wait of ours ran out — a connection a server has
 * closed is not noticed until the request written into it goes unanswered. Such a failure names the
 * connection rather than the repository, which is how a single file of a repository fails while
 * every other one is read, so the request is made again on a fresh connection. An answer of the
 * server, an error status included, is reported as it was, and so is a second attempt that fails as
 * well.
 */
async function answerTwice<T>(url: string, request: () => Promise<T>): Promise<T> {
  try {
    return await request()
  } catch (error) {
    if (!wentUnanswered(error)) throw error

    try {
      return await request()
    } catch (retried) {
      throw retried instanceof DownloadError ? retried : new DownloadError(url, null, retried)
    }
  }
}

/** Whether a failure happened before the server answered the request at all. */
function wentUnanswered(error: unknown) {
  return !(error instanceof DownloadError) || error.status === null
}

const redirectStatuses = [301, 302, 303, 307, 308]

/** Request a file of a repository, following the redirects that lead to the mirror serving it. */
function openResponse(url: string, redirects = 0): Promise<IncomingMessage> {
  const target = new URL(url)
  const agent = agents.get(target.protocol)

  return new Promise((resolve, reject) => {
    let answered = false

    const request = (target.protocol === 'https:' ? httpsGet : httpGet)(
      target,
      { headers: requestHeaders, agent },
      (response) => {
        answered = true
        const status = response.statusCode ?? 0
        const location = response.headers.location

        if (redirectStatuses.includes(status) && location) {
          // The answer to a redirect is not the file; it is read instead of destroyed, so that the
          // connection it arrived on can be reused rather than being torn down
          response.resume()
          resolve(
            redirects >= maxRedirects
              ? Promise.reject(new DownloadError(url, status))
              : openResponse(new URL(location, target).toString(), redirects + 1),
          )
          return
        }

        // A mirror that stops in the middle of a file has to fail the download instead of hanging
        // the run it is read by; the timeout is taken off the socket again once the response is
        // done, since the connection goes back to the agent and outlives the file
        const socket = response.socket
        response.setTimeout(downloadTimeout, () => {
          response.destroy(new DownloadError(url, null, new Error('Timed out while reading it')))
        })
        response.once('close', () => socket?.setTimeout(0))
        resolve(response)
      },
    )

    // A host whose address does not answer at all leaves the socket connecting, which the operating
    // system would only give up on after minutes
    request.on('socket', (socket) => {
      if (!socket.connecting) return
      const connectTimer = setTimeout(() => {
        socket.destroy(new DownloadError(url, null, new Error('Timed out while connecting')))
      }, connectTimeout)
      socket.once('connect', () => clearTimeout(connectTimer))
      socket.once('close', () => clearTimeout(connectTimer))
    })

    // A server that never answers is not publishing the file, and the run cannot wait for it
    const headersTimer = setTimeout(() => {
      if (answered) return
      request.destroy(new DownloadError(url, null, new Error('Timed out while requesting it')))
    }, downloadTimeout)

    request.on('close', () => clearTimeout(headersTimer))
    request.on('error', reject)
  })
}
