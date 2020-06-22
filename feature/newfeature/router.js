const express = require('express')

const { helperFunction } = require('./helper_functionality')

const router = express.Router()

router.get('/', async (req, res) => {
	res.json({ result: helperFunction() })
})

module.exports = router
