const express = require('express')
const app = express()

app.get('/', function (req, res) {
	res.send('Hello World!')
})

app.get('/token/:token', function (req, res) {
  res.send(req.params.token)
})

app.listen(3000, function () {
	console.log('Example app listening on port 3000!')
})