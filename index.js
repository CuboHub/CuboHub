'use strict'

const Client = require('@octokit/rest')
const fs = require('fs')
const jwt = require('jsonwebtoken')
const yaml = require('js-yaml')
const request = require("request-promise-native")
const jformat = require('jformat')
const hubdown = require('hubdown')
const dateTime = require('node-datetime')
const bytelabel = require('bytelabel')
const debug = require('debug')

const log = debug('CuboHub')

var github = new Client({
	debug: false
})

async function chAuth(installation_id) {
	log(`[+] chAuth: ${installation_id}`)
	var github = new Client({
		debug: false
	})

	if (installation_id == 1 && process.env.github_token) {
		github.authenticate({
			type: 'token',
			token: process.env.github_token
		})

	} else if (installation_id == 2 && process.env.github_cid && process.env.github_csecret) {
		github.authenticate({
			type: 'oauth',
			key: process.env.github_cid,
			secret: process.env.github_csecret
		})

	} else {
		var cert = process.env.github_key //(fs.readFileSync('cubohub.pem')).toString()
		var token = jwt.sign({}, cert, {
			algorithm: 'RS256',
			expiresIn: '2m',
			issuer: process.env.github_app_id
		})
		await github.authenticate({
			type: 'integration',
			token: token
		})
		var data = await github.apps.createInstallationToken({
			installation_id: installation_id
		})
		var new_token = data.data.token
		await github.authenticate({
			type: 'token',
			token: new_token
		})
	}
	return github
}

function chUpdateFile(github, path, code, message, branch, owner, repo, gitauthor) {
	log(`[+] chUpdateFile: +github, ${path}, +code, ${message}, ${branch}, ${owner}, ${repo}`)
	github.repos.getContent({
		owner: owner,
		repo: repo,
		path: path,
		ref: 'refs/heads/' + branch + ''
	}, function(err, res) {
		//log(err, res)
		var param = {
			owner: owner,
			repo: repo,
			path: path,
			message: message,
			branch: branch,
			content: Buffer.from(code).toString('base64'),
		}
		if (gitauthor && gitauthor.name == 'CuboHub[Bot]') {
			param.author = gitauthor
		} else if (gitauthor) {
			param.author = gitauthor
			param.committer = gitauthor
		}
		if (res && res.data.sha) {
			//log(res.data.sha)
			var sha = res.data.sha
			var content = Buffer.from(res.data.content, 'base64').toString()
			if (content == code) {
				log('[+] Same updateFile')
				return
			}
			param.sha = sha
			return github.repos.updateFile(param, function(err, res) {
				//log(err, res)
			})
		} else {
			return github.repos.createFile(param, function(err, res) {
				//log(err, res)
			})
		}
	})
}

async function chPage(github, owner, repo_name, yml, returnHTML) {
	log(`[+] chPage: +github, ${owner}, ${repo_name}, +yml, ${returnHTML}`)
	var dataTimeNow = dateTime.create();
	var config = yaml.safeLoad(yml);

	var repo = await github.repos.get({
		owner: owner,
		repo: repo_name
	})
	repo = repo.data

	var site = ''
	var link = '<a href="{url}">{title}</a>'
	if (config.template_raw) {
		site = await request(config.template_raw)
	} else {
		site = await request(`https://raw.githubusercontent.com/CuboHub/${config.template}-theme/master/default.html`)
		link = await request(`https://raw.githubusercontent.com/CuboHub/${config.template}-theme/master/link.html`)
	}
	if (config.link_template_raw) {
		link = await request(config.link_template_raw)
	}

	var cubohub = 'Created with <a href="https://CuboHub.github.io" target="_blank">CuboHub</a>'
	var seo = `
		<meta name="author" content="{author}" />
		<meta name="description" content="{description}" />
		<meta name="keywords" content="{keywords}" />
		<meta property="og:title" content="{title}"/>
		<meta property="og:image" content="{image}"/>
		<meta property="og:url" content="{url}"/>
		<meta property="og:site_name" content="{site_name}"/>
		<meta property="og:description" content="{description}"/>
		<meta name="twitter:title" content="{title}" />
		<meta name="twitter:image" content="{image}" />
		<meta name="twitter:url" content="{url}" />
		<meta name="twitter:card" content="{twitter_card}" />
	`
	if (!config.seo) {
		config.seo = {}
	}
	seo = seo.format({
		author: config.seo['author'] || owner,
		description: config.seo['description'] || config.description,
		keywords: config.seo['keywords'] || repo.name,
		title: config.seo['title'] || config.title || repo.name,
		image: config.seo['image'] || '',
		url: config.seo['url'] || '',
		site_name: config.seo['site_name'] || config.title || repo.name,
		twitter_card: config.seo['twitter_card'] || ''
	}, true)

	var links = config.links || {}
	var links_html = ''
	for (var index in links) {
		var url = links[index]
		links_html += link.format({
			url: url,
			title: index
		}, true) + '\n'
	}

	var readme_md = ''
	if (config.readme) {
		if (config.readme == true) {
			config.readme = 'README.md'
		}
		if (!config.readme == true) {
			readme_md == ''
		} else {
			var readme_data = await github.repos.getContent({
				owner: owner,
				repo: repo_name,
				path: config.readme || 'README.md'
			})
			readme_md = Buffer.from(readme_data.data.content, 'base64').toString()
		}
	}

	var iframe_html = ''
	if (config.iframe) {
		if (config.iframe == true) {
			config.iframe = 'iframe.html'
		}
		if (!config.iframe == true) {
			iframe_html = ''
		} else {
			var iframe_data = await github.repos.getContent({
				owner: owner,
				repo: repo_name,
				path: config.iframe_html || 'iframe.html'
			})
			iframe_html = Buffer.from(iframe_data.data.content, 'base64').toString()
		}
	}

	var readme_html = await hubdown(readme_md)
	readme_html = readme_html.content
	var content_html = readme_html + iframe_html

	var size_repo_kb = (config.size || repo.size) * 1024
	var size_repo = bytelabel(size_repo_kb, {
		round: true
	})

	var info = {
		id: repo.id,
		private: repo.private,
		title: config.title || repo.name,
		repo: config.repo || repo.name,
		name: repo.name,
		full_name: config.full_name || repo.full_name,
		homepage: repo.homepage,
		description: config.description || repo.description,
		language: config.language || repo.language,
		size: size_repo,
		size_kb: size_repo_kb,
		watchers: repo.watchers || '0',
		forks_count: repo.forks_count || '0',
		fork: repo.forks_count || '0',
		stargazers_count: repo.stargazers_count || '0',
		stars: repo.stargazers_count || '0',
		readme_html: readme_html || '',
		iframe_html: iframe_html || '',
		created_at: repo.created_at,
		updated_at: repo.updated_at,
		pushed_at: repo.pushed_at,
		content_html: content_html,
		html_url: repo.html_url,
		git_url: repo.git_url,
		ssh_url: repo.ssh_url,
		clone_url: repo.clone_url,
		svn_url: repo.svn_url,
		default_branch: repo.default_branch,
		license: repo.license,
		forks: repo.forks,
		open_issues: repo.open_issues,
		open_issues_count: repo.open_issues_count,
		has_issues: repo.has_issues,
		has_projects: repo.has_projects,
		has_downloads: repo.has_downloads,
		has_wiki: repo.has_wiki,
		has_pages: repo.has_pages,
		mirror_url: repo.mirror_url,
		archived: repo.archived,
		seo: seo,
		links: links_html,
		cubohub: cubohub
	}

	var branch = 'master'
	if (config.branch) {
		branch = config.branch
	}

	var dataTimeNowStr = dataTimeNow.format('m/d/Y H:M')
	var cmessage = `Update GitHub Page: ${dataTimeNowStr}`
	if (config.cmessage) {
		cmessage = config.cmessage
	}

	var name = 'CuboHub[Bot]'
	var email = 'Bot@CuboHub.github.io'
	if (config.gitauthor) {
		if (config.gitauthor.name && config.gitauthor.email) {
			name = config.gitauthor.name
			email = config.gitauthor.email
		}
	}
	var gitauthor = {
		name: name,
		email: email
	}

	site = site.format(info, true)
	if (returnHTML) {
		return site
	} else {
		return chUpdateFile(github, 'index.html', site, cmessage, branch, owner, repo_name, gitauthor)
	}
}

function chCheckXML(github, owner, repo, path) {
	log(`[+] chCheckXML: +github, ${owner}, ${repo}, ${path}`)
	var yml = ''
	github.repos.getContent({
		owner: owner,
		repo: repo,
		path: path
	}, function(err, res) {
		if (res) {
			yml = Buffer.from(res.data.content, 'base64').toString()
			return chPage(github, owner, repo, yml, false)
		}
	})
}

function chCheckAllXML(github, owner, repo) {
	log(`[+] chCheckAllXML: +github, ${owner}, ${repo}`)
	var listXML = [
		'.cubohub.yml',
		'.cuboHub.yml',
		'.CuboHub.yml',
		'cubohub.yml',
		'cuboHub.yml',
		'CuboHub.yml',
		'.github/cubohub.yml',
		'.github/cuboHub.yml',
		'.github/CuboHub.yml'
	]
	listXML.forEach(path => {
		chCheckXML(github, owner, repo, path)
	})
}

async function chInit(installation_id, owner, repo) {
	if (process.env.owner && owner == process.env.owner) {
		installation_id = 1
	}
	log(`[+] chInit: ${installation_id}, ${owner}, ${repo}`)
	var github = await chAuth(installation_id)
	return chCheckAllXML(github, owner, repo)
}

async function chUpdateAllRepo(installation_id, owner) {
	if (process.env.owner && owner == process.env.owner) {
		installation_id = 1
	}
	log(`[+] chUpdateAllRepo: ${installation_id}, ${owner}`)
	var github = await chAuth(installation_id)
	var result = await github.repos.getForUser({
		username: owner,
		per_page: 100
	})
	result.data.forEach(repo => {
		chCheckAllXML(github, owner, repo.name)
	})
}

//chAuth(installation_id)
//app.chAuth(64019)

//chCheckXML(github, owner, repo, path)
//chCheckXML(github, 'TiagoDanin', 'TestGithub', 'cubohub.yml')

//chCheckAllXML(github, owner, repo)
//chCheckAllXML(github, 'TiagoDanin', 'TestGithub')

//chPage(github, owner, repo, yml, returnHTML)
//chPage(github, 'TiagoDanin', 'TestGithub', 'yml', false)

//chUpdateFile(github, path, code, message, branch, owner, repo, gitauthor)
//chUpdateFile(github, 'index.html', '<html><h1>Hello World!</h1></html>', 'TEST: UP', 'master', 'TiagoDanin', 'TestGithub', {name: 'Bot', email: 'My@Bot.Bot'})

//chInit(installation_id, owner, repo)
//chInit(64019, 'TiagoDanin', 'TestGithub')

//chUpdateAllRepo(installation_id, owner)
//chUpdateAllRepo(1, 'TiagoDanin')

module.exports = {
	github,
	chAuth,
	chCheckXML,
	chCheckAllXML,
	chPage,
	chUpdateFile,
	chInit,
	chUpdateAllRepo
}
