const GithubWebHook = require('express-github-webhook')
const express       = require('express')
const https         = require('https')
const http          = require('http')
const app           = require('./app.js')
const bodyParser    = require('body-parser')

var webhookHandler = GithubWebHook({
	path: '/webhook',
	secret: process.env.webhooks_secret
});

console.log('[+] Start')
var app_express = express();
app_express.use(bodyParser.json())
app_express.use(webhookHandler)
app_express.set('port', process.env.PORT)

app_express.get('/', function (req, res) {
	res.send('Hello World!')
})

webhookHandler.on('push', function (event, repo, data) {
	console.log(event)
	console.log('\n\n')
	console.log(repo)
	console.log('\n\n')
	console.log(data)
	console.log('\n\n')
	var repo = payload.repository.name
	var owner = payload.repository.owner.name
	console.log(`[+] webhooks:push: ${id}, ${name}, ${owner}, +payload`)
	app.chCheckXML(app.github, owner, repo)
});

var web = http
if (process.env.web_protocol && process.env.web_protocol == 'https') {
	web = https
}

app_express.listen(app_express.get('port'), function() {
	console.log('[+] Port: ', app_express.get('port'))
})