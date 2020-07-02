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
    const itasCorrelationId = nanoid()

    try {
      log.info("", {
        itasCorrelationId,
        name: 'Sending request',
        upstreamURL,
        consecutiveErrorCount,
        errorIsReported
      })

      let response = await axios.request({
        baseURL: upstreamURL,
        url: '/pong',
        method: 'POST',
        headers: {
          apikey: apiKey,
          'x-itas-correlation-id': itasCorrelationId
        },
        timeout: pingTimeoutMillis
      })

      log.info(response.status.toString(), {
        itasCorrelationId,
        name: "Response OK"
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
        log.error("", { // Ex: "timeout of 8000ms exceeded"
          itasCorrelationId,
          name: error.message
        })
      } else {
        let errorMessage = getErrorMessage(error);
        log.error(error.response.status, {
          itasCorrelationId,
          name: errorMessage
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
      log.error(error.response.status, {
        itasCorrelationId,
        name: "Notifying slack",
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
        log.error({
          itasCorrelationId,
          name: "Webhook send failed. Details: " + err.message ? err.message : "(no details)"
        })
      }
    }

    function getAtChannel() {
      return atChannel ? '<!channel> ' : ''
    }
  }

  log.info("", {
    name: 'Application started',
    pingTimeoutMillis
  })

  setInterval(async () => {
    await ping()
  }, intervalMillis)
}
