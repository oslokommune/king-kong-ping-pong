import winston from 'winston'

const LOG_SIMPLE_LOGGING : boolean = process.env.USE_SIMPLE_LOGGING?.toLowerCase() == 'true' || false
const LOG_PRETTY_PRINT : boolean = process.env.LOG_PRETTY_PRINT?.toLowerCase() == 'true' || false

let formatting:any[] = [winston.format.timestamp()]

if (LOG_SIMPLE_LOGGING) {
	const simpleFormat = winston.format.printf(({ level, message, timestamp }) => {
		if (typeof(message) === "object") {
			let json = JSON.stringify(message)
			return `${timestamp} ${level}: ${json}`
		}

		return `${timestamp} ${level}: ${message}`;
	});
	formatting.push(simpleFormat)
} else if (LOG_PRETTY_PRINT) {
	formatting.push(winston.format.prettyPrint())
} else {
	formatting.push(winston.format.json())
}

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
