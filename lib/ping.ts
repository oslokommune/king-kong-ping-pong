import axios from 'axios'
import { IncomingWebhook } from '@slack/webhook'

export function startPingJob (intervalMillis : number, upstreamURL : string, webhookURL: string, apiKey: string) {
  const webhook : IncomingWebhook = new IncomingWebhook(webhookURL)
  let previousStatus : string = 'OK'

  setInterval(async () => {
    try {
      await axios.request({
        baseURL: upstreamURL,
        url: '/pong',
        method: 'POST',
        headers: { apiKey }
      })

      if (previousStatus === 'OK') return

      previousStatus = 'OK'

      webhook.send('I feel much better now')
    } catch (error) {
      let problem

      if (error.response) problem = error.response.status + ''
      else problem = 'no response'

      if (previousStatus === problem) return

      previousStatus = problem

      webhook.send(`I'm getting ${problem} when trying to ping myself..`)
    }
  }, intervalMillis)
}
