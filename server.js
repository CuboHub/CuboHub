const WebhooksApi   = require('@octokit/webhooks')
const https         = require('https')
const http          = require('http')
const app           = require('./app.js')

const webhooks    = new WebhooksApi({
	secret: process.env.webhooks_secret
})

const web = http
if (process.env.web_protocol && process.env.web_protocol == 'https') {
	web = https
}

console.log('[+] Start')
webhooks.on('push', ({id, name, payload}) => {
	var repo = payload.repository.name
	var owner = payload.repository.owner.name
	console.log(`[+] webhooks:push: ${id}, ${name}, ${owner}, +payload`)
	app.chCheckXML(app.github, owner, repo)
})

web.createServer(webhooks.middleware).listen(process.env.PORT)
console.log('[+] Port: ', process.env.PORT)