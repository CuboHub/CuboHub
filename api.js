const app = require('./index.js')
const request = require("request-promise-native")
const debug = require('debug')

const log = debug('CuboHub:Api')

async function webview(owner, repo, theme) {
	log(`[+] api:webview ${owner}, ${repo}, ${theme}`)
	var yml = await request(`https://raw.githubusercontent.com/CuboHub/${theme}-theme/master/cubohub.yml`)
	var github = await app.chAuth(2)
	var html = await app.chPage(github, owner, repo, yml, true)
	return html
}

module.exports = {
	webview
}
