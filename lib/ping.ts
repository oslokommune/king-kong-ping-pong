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
    errosBeforeNotify : number,
    atChannel : boolean)
{
  const webhook : IncomingWebhook = new IncomingWebhook(webhookURL)
  let consecutiveErrorCount = 0
  let errorIsReported = false

  async function ping() {
    const itasCorrelationId = nanoid()
    const url = upstreamURL + '/pong'

    try {
      log.info("", {
        itasCorrelationId,
        name: 'Sending request',
        url,
        consecutiveErrorCount,
        errorIsReported
      })

      let response = await axios.request({
        url,
        method: 'POST',
        headers: {
          apikey: apiKey,
          'x-itas-correlation-id': itasCorrelationId
        },
        timeout: pingTimeoutMillis
      })

      log.info(response.status.toString(), {
        itasCorrelationId,
        consecutiveErrorCount,
        name: "Response OK"
      })

      consecutiveErrorCount = 0

      if (errorIsReported) {
        await reportOk()
        errorIsReported = false
      }
    } catch (error) {
      consecutiveErrorCount++
      logError(error);

      if (!errorIsReported) {
        if (consecutiveErrorCount > errosBeforeNotify) {
          await reportError(error);
          errorIsReported = true
        }
      }
    }

    function logError(error:any) {
      if (error.code === 'ECONNABORTED') { // Timeout
        log.error("", {
          itasCorrelationId,
          errorIsReported,
          consecutiveErrorCount,
          errosBeforeNotify,
          name: error.message  // Ex: "timeout of 8000ms exceeded"
        })
      } else {
        let errorMessage = getErrorMessage(error);
        log.error(error.response.status, {
          itasCorrelationId,
          errorIsReported,
          consecutiveErrorCount,
          errosBeforeNotify,
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
      log.error("", {
        itasCorrelationId,
        name: "Notifying slack about error",
        upstreamURL
      })

      let errorMessage = getErrorMessage(error);
      let msg =
          getAtChannel() +
          `I'm getting ${error.response.status} when trying to ping myself. Response: ${errorMessage}\n` +
          `itasCorrelationId: ${itasCorrelationId}\n` +
          `Maybe someone else wants to try: \`curl -X "POST" -H "apikey: ${apiKey}" ${upstreamURL}/pong\`\n` +
          'Wait! Take this: https://github.oslo.kommune.no/origodigi/kong/blob/master/README.md It will help you on your quest. God speed.'
      await webhookSend(msg)
    }

    async function reportOk() {
      log.info("", {
        itasCorrelationId,
        name: "Notifying slack that everything's fine again",
        upstreamURL
      })

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
    intervalMillis,
    pingTimeoutMillis,
    upstreamURL,
    errosBeforeNotify,
    atChannel
  })

  setInterval(async () => {
    await ping()
  }, intervalMillis)
}
