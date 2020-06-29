import winston from 'winston'
import expressWinston from 'express-winston'

const formatting = [winston.format.json(), winston.format.timestamp()]
if (process.env.LOG_PRETTY_PRINT) formatting.push(winston.format.prettyPrint())

const options = {
	level: process.env.LOG_LEVEL || 'info',
	format: winston.format.combine(...formatting),
	defaultMeta: { service: 'king-kong-ping-pong' },
	transports: [new winston.transports.Console()]
}

export const log : winston.Logger = new (winston.createLogger as any)({
	...options,
	exceptionHandlers: [new winston.transports.Console()]
})

export const requestLogMiddleware = expressWinston.logger({
	...options,
	ignoredRoutes: ['/health']
})
