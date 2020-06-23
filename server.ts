import { config } from 'dotenv'
config()
import express from 'express'
import http from "http";

import { createApp } from './lib/app'
import { startPingJob } from "./lib/ping";

const PORT : string = process.env.PORT || '3000'
const PING_INTERVAL_MS : string = process.env.PING_INTERVAL_MS || '5000'
const UPSTREAM_URL : string = process.env.UPSTREAM_URL || ''
const SLACK_WEBHOOK_URL : string = process.env.SLACK_WEBHOOK_URL || ''
const KONG_API_KEY : string = process.env.KONG_API_KEY || ''

if (!UPSTREAM_URL) throw new Error('Missing upstream url to itself. Please configure the UPSTREAM_URL env variable')
if (!SLACK_WEBHOOK_URL) throw new Error('Missing slack webhook URL. Please configure the SLACK_WEBHOOK_URL env variable')
if (!KONG_API_KEY) throw new Error('Missing api key. Please configure the KONG_API_KEY env variable')

function runServer(app: express.Application) {
	const server : http.Server = app.listen(PORT, () => {
		console.log(`Listening on ${PORT}`)

		startPingJob(
			Number.parseInt(PING_INTERVAL_MS),
			UPSTREAM_URL,
			SLACK_WEBHOOK_URL,
			KONG_API_KEY
		)
	})

	process.on('SIGINT', () => {
		server.close(() => process.exit(0))
	})
}

createApp().then(runServer)
