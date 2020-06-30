import axios from 'axios'
import { IncomingWebhook } from '@slack/webhook'
import { nanoid } from "nanoid"

import { log } from './logging'

export function startPingJob (intervalMillis : number, upstreamURL : string, webhookURL: string, apiKey: string, max_duplicates : number, atChannel : string) {
  const webhook : IncomingWebhook = new IncomingWebhook(webhookURL)
  let knownStatus : string = ''
  let previousStatus : string = ''
  let newStatus : string = ''
  let duplicateMessages : number = 0

  setInterval(async () => {
    const correlationID = nanoid()
    let msg : string = ''
    if (atChannel) msg = '<!channel> '

    try {
      log.info('Sending request', {
        upstreamURL,
        correlationID,
        duplicateMessages,
        knownStatus,
        previousStatus,
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

      newStatus = 'OK'
      msg = 'I feel much better now'
    } catch (error) {
      let problem

      if (error.response) problem = error.response.status + ''
      else problem = 'no response'

      log.error(error.response.statusText, {
        upstreamURL,
        correlationID,
        status: error.response.status
      })

      newStatus = problem
      msg +=
          `I'm getting ${problem} when trying to ping myself..\n` +
          `Maybe someone else wants to try: \`curl -X "POST" -H "apikey: ${apiKey}" ${upstreamURL}\`\n` +
          'Wait! Take this: https://github.oslo.kommune.no/origodigi/kong/blob/master/README.md It will help you on your quest. God speed.'
    }

    if (knownStatus === newStatus) return

    if (previousStatus !== newStatus) {
      previousStatus = newStatus
      duplicateMessages = 0
    }
    else duplicateMessages += 1

    if (duplicateMessages !== max_duplicates) return

    knownStatus = newStatus
    webhook.send(msg)
  }, intervalMillis)
}
