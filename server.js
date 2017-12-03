const WebhooksApi = require('@octokit/webhooks')
const http        = require('http')
const app         = require('./app.js')

const webhooks    = new WebhooksApi({
	secret: process.env.webhooks_secret
})

console.log('[+] Start')
webhooks.on('push', ({id, name, payload}) => {
	var repo = payload.repository.name
	var owner = payload.repository.owner.name
	console.log(`[+] webhooks:push: ${id}, ${name}, ${owner}, +payload`)
	app.chCheckXML(app.github, owner, repo)
})

http.createServer(webhooks.middleware).listen(process.env.PORT)
console.log('[+] Port: ', process.env.PORT)