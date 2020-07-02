import axios from 'axios'
import { IncomingWebhook } from '@slack/webhook'
import { nanoid } from "nanoid"

import { log } from './logging'

export function startPingJob (
    intervalMillis: number,
    pingTimeoutMillis: number,
    upstreamURL : string,
    webhookURL: string,
    apiKey: string,
    triesBeforeNotify : number,
    atChannel : boolean)
{
  const webhook : IncomingWebhook = new IncomingWebhook(webhookURL)
  let consecutiveErrorCount = 0
  let errorIsReported = false

  async function ping() {
    const correlationID = nanoid()

    try {
      log.info('Sending request', {
        upstreamURL,
        correlationID,
        consecutiveErrorCount,
        errorIsReported
      })

      let response = await axios.request({
        baseURL: upstreamURL,
        url: '/pong',
        method: 'POST',
        headers: {
          apikey: apiKey,
          'x-itas-correlation-id': correlationID
        },
        timeout: pingTimeoutMillis
      })

      log.info("OK", {
        status: response.status,
        correlationID
      })

      consecutiveErrorCount = 0

      if (errorIsReported) {
        await reportOk()
        errorIsReported = false
      }
    } catch (error) {
      logError(error);

      if (!errorIsReported) {
        consecutiveErrorCount++

        if (consecutiveErrorCount > triesBeforeNotify) {
          await reportError(error);
          errorIsReported = true
        }
      }
    }

    function logError(error:any) {
      if (error.code === 'ECONNABORTED') { // Timeout
        log.error(error.message, { // Ex: "timeout of 8000ms exceeded"
          correlationID
        })
      } else {
        let errorMessage = getErrorMessage(error);
        log.error(errorMessage, {
          correlationID,
          status: error.response.status
        })
      }
    }

    function getErrorMessage(error:any) {
      let errorMessage = "(no response message)"
      if (error.response && error.response.message)
        errorMessage = error.response.message
      return errorMessage;
    }

    async function reportError(error: any) {
      log.error("Notifying slack", {
        correlationID,
        status: error.response.status,
        upstreamURL
      })

      let errorMessage = getErrorMessage(error);
      let msg =
          getAtChannel() +
          `I'm getting ${error.response.status} when trying to ping myself. Response: ${errorMessage}\n` +
          `Maybe someone else wants to try: \`curl -X "POST" -H "apikey: ${apiKey}" ${upstreamURL}/pong\`\n` +
          'Wait! Take this: https://github.oslo.kommune.no/origodigi/kong/blob/master/README.md It will help you on your quest. God speed.'
      await webhookSend(msg)
    }

    async function reportOk() {
      await webhookSend(getAtChannel() + "I'm feeling better now")
    }

    async function webhookSend(msg: string) {
      try {
        await webhook.send(msg)
      } catch (err) {
        // If slack webhook fails, the error will a TypeError
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypeError
        if (err.message === "Cannot read property 'replace' of null") {
          log.error("Webhook send failed", {
            correlationID
          })
        } else {
          log.error(err, {
            correlationID
          })
        }
      }
    }

    function getAtChannel() {
      return atChannel ? '<!channel> ' : ''
    }
  }

  log.info('Application started', {
    pingTimeoutMillis
  })

  setInterval(async () => {
    await ping()
  }, intervalMillis)
}
