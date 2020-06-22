require('dotenv').config()

const { createApp } = require('./lib/app')

const PORT = process.env.PORT || 3000

createApp()
	.then(app => {
		app.listen(PORT, () => {
			console.log(`Listening on ${PORT}`)
		})
	})
