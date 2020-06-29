import axios from 'axios'
import { IncomingWebhook } from '@slack/webhook'

export function startPingJob (intervalMillis : number, upstreamURL : string, webhookURL: string, apiKey: string, max_duplicates : number, atChannel : string) {
  const webhook : IncomingWebhook = new IncomingWebhook(webhookURL)
  let knownStatus : string = ''
  let previousStatus : string = ''
  let newStatus : string = ''
  let duplicateMessages : number = 0

  setInterval(async () => {
    let msg : string = ''
    if (atChannel) msg = '<!channel> '

    try {
      await axios.request({
        baseURL: upstreamURL,
        url: '/pong',
        method: 'POST',
        headers: { apikey: apiKey }
      })

      newStatus = 'OK'
      msg = 'I feel much better now'
    } catch (error) {
      let problem

      if (error.response) problem = error.response.status + ''
      else problem = 'no response'

      newStatus = problem
      msg +=
          `I'm getting ${problem} when trying to ping myself..\n` +
          `Maybe someone else wants to try: \`curl -X "POST" -H "apikey: ${apiKey}" https://kkpp.api-test.oslo.kommune.no/pong\`\n` +
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
