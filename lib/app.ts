import express from 'express'
import { requestLogMiddleware } from './logging'

export async function createApp () {
  const app : express.Application = express()

  app.disable('etag')
  // @ts-ignore
  app.use(express.urlencoded({ extended: false }))
  app.use(express.json())

  app.get('/health', function (req : express.Request, res : express.Response) {
    res.sendStatus(200)
  })

  app.use(requestLogMiddleware)

  app.post('/pong', (req : express.Request, res : express.Response) => {
    res.status(200).end()
  })

  app.use((err : express.Errback, req : express.Request, res : express.Response, next : express.NextFunction) => {
    console.error('Something bad happened', err)
    res.status(500).end()
  })

  return app
}
