const WebhooksApi = require('@octokit/webhooks')
const webhooks = new WebhooksApi({
	secret: 'mysecret'
})

webhooks.on('push', ({id, name, payload}) => {
	console.log(name)
	console.log(payload)
})

require('http').createServer(webhooks.middleware).listen(3000)