import axios from 'axios'
import { IncomingWebhook } from '@slack/webhook'

export function startPingJob (intervalMillis : number, upstreamURL : string, webhookURL: string, apiKey: string) {
  const webhook : IncomingWebhook = new IncomingWebhook(webhookURL)
  let previousStatus : string = ''

  setInterval(async () => {
    try {
      await axios.request({
        baseURL: upstreamURL,
        url: '/pong',
        method: 'POST',
        headers: { apikey: apiKey }
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

      webhook.send(
          `<!channel> I'm getting ${problem} when trying to ping myself..\n` +
          `Maybe someone else wants to try: \`curl -X "POST" -H "apikey: ${apiKey}" https://kkpp.api-test.oslo.kommune.no/pong\`\n` +
          'Wait! Take this: https://github.oslo.kommune.no/origodigi/kong/blob/master/README.md It will help you on your quest. God speed.'
      )
    }
  }, intervalMillis)
}
