const GithubWebHook = require('express-github-webhook')
const express = require('express')
const https = require('https')
const http = require('http')
const app = require('./index.js')
const api = require('./api.js')
const bodyParser = require('body-parser')
const debug = require('debug')

const log = debug('CuboHub:Server')

const webhookHandler = GithubWebHook({
	path: '/webhooks',
	secret: process.env.webhooks_secret
});

log('[+] Start')
const app_express = express();
app_express.use(bodyParser.json())
app_express.use(webhookHandler)
app_express.set('port', process.env.PORT)

//Home
//get:/
app_express.get('/', function(req, res) {
	res.send('Hello World!\nGO > htpps://CuboHub.github.io')
})

//API- webview
//get:/api/webview/owner/TiagoDanin/repo/TestGithub/theme/Elate
app_express.get('/api/webview/owner/:owner/repo/:repo/theme/:theme', async function(req, res) {
	log(`[+] api:webview ${req.params.owner}, ${req.params.repo}, ${req.params.theme}`)
	var html = await api.webview(req.params.owner, req.params.repo, req.params.theme)
	res.send(html)
})

webhookHandler.on('push', function(repo, data) {
	try {
		var installation_id = data.installation.id
		var owner = data.repository.owner.name
		var repo = data.repository.name
		log(`[+] webhooks:push: ${installation_id}, ${owner}, ${repo}`)
		app.chInit(installation_id, owner, repo)
	} catch (e) {
		log(`[-] Error:\n${e}\n\n`);
	}
});

app_express.listen(app_express.get('port'), function() {
	log('[+] Port: ', app_express.get('port'))
})
