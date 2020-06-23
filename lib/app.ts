import express from 'express'
import morgan from 'morgan'

// @ts-ignore
const logger : morgan.Morgan<any, any> = morgan('dev', {
  skip (req : express.Request, res: express.Response): boolean {
    return req.url === '/health'
  }
})

export async function createApp () {
  const app : express.Application = express()

  app.disable('etag')
  // @ts-ignore
  app.use(logger)
  app.use(express.urlencoded({ extended: false }))
  app.use(express.json())

  app.get('/health', function (req : express.Request, res : express.Response) {
    res.sendStatus(200)
  })

  app.post('/pong', (req : express.Request, res : express.Response) => {
    res.status(200).end()
  })

  app.use((err : express.Errback, req : express.Request, res : express.Response, next : express.NextFunction) => {
    console.error('Something bad happened', err)
    res.status(500).end()
  })

  return app
}
