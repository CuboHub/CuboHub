const WebhooksApi = require('@octokit/webhooks')
const webhooks = new WebhooksApi({
  secret: 'mysecret'
})


console.log('[+] Start')
webhooks.on('*', ({id, name, payload}) => {
	console.log(name)
	console.log(payload)
	console.log('\n\n\n')
	console.log(payload.repository.name)
	console.log(payload.repository.owner.name)
})

require('http').createServer(webhooks.middleware).listen(process.env.PORT)
console.log('[+] Port ', process.env.PORT)