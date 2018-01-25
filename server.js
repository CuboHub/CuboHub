const GithubWebHook = require('express-github-webhook')
const express       = require('express')
const https         = require('https')
const http          = require('http')
const app           = require('./app.js')
const bodyParser    = require('body-parser')

const webhookHandler = GithubWebHook({
	path: '/webhooks',
	secret: process.env.webhooks_secret
});

console.log('[+] Start')
const app_express = express();
app_express.use(bodyParser.json())
app_express.use(webhookHandler)
app_express.set('port', process.env.PORT)

app_express.get('/', function (req, res) {
	res.send('Hello World!\nGO > htpps://CuboHub.github.io')
})

// API/$method_name/+$params/$:value
app_express.get('/api/rebuild/owner/:owner/repo/:repo/installation_id/:installation_id', function (req, res) {
	console.log(`[+] api:rebuild ${req.params.owner}, ${req.params.repo}`)
	var status = 'Success'
	try {
		app.chInit(req.params.installation_id, req.params.owner, req.params.repo)
	} catch (e) {
		console.log(`[-] Error:\n${e}\n\n`);
		status = 'Failed'
	}
	var site = `{"owner": "${req.params.owner}"\n"repo": "${req.params.repo}"\n"build": "${status}"}`
	//res.send(site)
})

app_express.get('/api/webview/owner/:owner/repo/:repo', function (req, res) {
	console.log(`[+] api:webview ${req.params.owner}, ${req.params.repo}`)
	res.send('#SOON')
})

webhookHandler.on('push', function (repo, data) {
	try {
		var installation_id = data.installation.id
		var owner = data.repository.owner.name
		var repo = data.repository.name
		console.log(`[+] webhooks:push: ${installation_id}, ${owner}, ${repo}`)
		app.chInit(installation_id, owner, repo)
	} catch (e) {
		console.log(`[-] Error:\n${e}\n\n`);
	}
});

var web = http
if (process.env.web_protocol && process.env.web_protocol == 'https') {
	web = https
}

app_express.listen(app_express.get('port'), function() {
	console.log('[+] Port: ', app_express.get('port'))
})
