import axios from 'axios'
import { IncomingWebhook } from '@slack/webhook'
import { nanoid } from "nanoid"

import { log } from './logging'

export function startPingJob (intervalMillis : number, upstreamURL : string, webhookURL: string, apiKey: string, triesBeforeNotify : number, atChannel : string) {
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

      await axios.request({
        baseURL: upstreamURL,
        url: '/pong',
        method: 'POST',
        headers: {
          apikey: apiKey,
          'x-itas-correlation-id': correlationID
        }
      })

      consecutiveErrorCount = 0

      if (errorIsReported) {
        reportOk()
        errorIsReported = false
      }
    } catch (error) {
      if (!errorIsReported) {
        consecutiveErrorCount++

        if (consecutiveErrorCount > triesBeforeNotify) {
          let problem = error.response ? error.response.status + '' : 'no response'

          logError(correlationID, error, problem)
          reportError(problem);
          errorIsReported = true
        }
      }
    }
  }

  function logError(correlationID: string, error: any, problem: string) {
    log.error(problem, {
      upstreamURL,
      correlationID,
      status: error.response.status
    })
  }

  function reportError(problem: string) {
    let msg =
        getAtChannel() +
        `I'm getting ${problem} when trying to ping myself..\n` +
        `Maybe someone else wants to try: \`curl -X "POST" -H "apikey: ${apiKey}" ${upstreamURL}/pong\`\n` +
        'Wait! Take this: https://github.oslo.kommune.no/origodigi/kong/blob/master/README.md It will help you on your quest. God speed.'
    webhook.send(msg)
  }

  function reportOk() {
    webhook.send(getAtChannel() + "I'm feeling better now")
  }

  function getAtChannel() {
    return atChannel ? '<!channel> ' : ''
  }

  setInterval(async () => {
    await ping()
  }, intervalMillis)
}
