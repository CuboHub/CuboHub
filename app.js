'use strict'

var Client    = require('github')
var fs        = require('fs');
var yaml      = require('js-yaml');
var request   = require("request-promise-native")
var jformat   = require('jformat');
var hubdown   = require('hubdown')
var bytelabel = require('bytelabel')

var github = new Client({
	debug: false
})

github.authenticate({
	type: 'token',
	token: fs.readFileSync('token', 'utf8')
})

function chUpdateFile(github, path, code, message, branch, owner, repo) {
	console.log(`[+] chUpdateFile: +github, ${path}, +code, ${message}, ${branch}, ${owner}, ${repo}`)
	github.repos.getContent({
		owner: owner,
		repo: repo,
		path: path,
		ref: 'refs/heads/' + branch + ''
	}, function (err, res) {
		//console.log(err, res)
		if (res && res.data.sha) {
			//console.log(res.data.sha)
			var sha = res.data.sha
			github.repos.updateFile({
				owner: owner,
				repo: repo,
				path: path,
				message: message,
				branch: branch,
				content: Buffer.from(code).toString('base64'),
				sha: sha
			}, function (err, res) {
				//console.log(err, res)
			})
		} else {
			github.repos.createFile({
				owner: owner,
				repo: repo,
				path: path,
				message: message,
				branch: branch,
				content: Buffer.from(code).toString('base64')
			}, function (err, res) {
				//console.log(err, res)
			})
		}
	})
}

async function chPage(github, owner, repo_name, yml) {
	console.log(`[+] chPage: +github, ${owner}, ${repo}, +yml`)
	var config = yaml.safeLoad(yml);
	
	var site = ''
	if (config.template_raw) {
		site = await request(config.template_raw)
	} else {
		site = yaml.safeLoad(fs.readFileSync('template/' + config.template + '.html', 'utf8'));
	}

	var readme_md = ''
	if (config.readme || config.readme_file) {
		var readme_data = await github.repos.getContent({
			owner: owner,
			repo: repo_name,
			path: config.readme_file || 'README.md'
		})
		readme_md = Buffer.from(readme_data.data.content, 'base64').toString()
	}

	var iframe_html = ''
	if (config.iframe || config.iframe_html) {
		var iframe_data = await github.repos.getContent({
			owner: owner,
			repo: repo_name,
			path: config.iframe_html || 'iframe.html'
		})
		iframe_html = Buffer.from(iframe_data.data.content, 'base64').toString()
	}

	var readme_html = await hubdown(readme_md)
	readme_html = readme_html.content
	var content_html = readme_html + iframe_html

	var repo = await github.repos.get({
		owner: owner,
		repo: repo_name
	})
	repo = repo.data

	var size_repo_kb = (config.size || repo.size) * 1024
	var size_repo = bytelabel(size_repo_kb, {round: true})

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
		watchers: repo.watchers || 0,
		forks_count: repo.forks_count || 0,
		fork: repo.forks_count || 0,
		stargazers_count: repo.stargazers_count || 0,
		stars: repo.stargazers_count || 0,
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
	}

	site = site.format(info, true)

	chUpdateFile(github, 'index.html', site, 'TEST: UP', 'master', owner, repo_name)
}

function chCheckXML(github, owner, repo) {
	console.log(`[+] chCheckXML: +github, ${owner}, ${repo}`)
	var yml = ''
	github.repos.getContent({
		owner: owner,
		repo: repo,
		path: '.github/cuboHub.yml'
	}, function (err, res) {
		if (res) {
			yml = Buffer.from(res.data.content, 'base64').toString()
			return chPage(github, owner, repo, yml)
		}
	})
	github.repos.getContent({
		owner: owner,
		repo: repo,
		path: '.github/CuboHub.yml'
	}, function (err, res) {
		if (res) {
			yml = Buffer.from(res.data.content, 'base64').toString()
			return chPage(github, owner, repo, yml)
		}
	})
	github.repos.getContent({
		owner: owner,
		repo: repo,
		path: '.github/cubohub.yml'
	}, function (err, res) {
		if (res) {
			yml = Buffer.from(res.data.content, 'base64').toString()
			return chPage(github, owner, repo, yml)
		}
	})
	github.repos.getContent({
		owner: owner,
		repo: repo,
		path: 'cuboHub.yml'
	}, function (err, res) {
		if (res) {
			yml = Buffer.from(res.data.content, 'base64').toString()
			return chPage(github, owner, repo, yml)
		}
	})
	github.repos.getContent({
		owner: owner,
		repo: repo,
		path: 'CuboHub.yml'
	}, function (err, res) {
		if (res) {
			yml = Buffer.from(res.data.content, 'base64').toString()
			return chPage(github, owner, repo, yml)
		}
	})
	github.repos.getContent({
		owner: owner,
		repo: repo,
		path: 'cubohub.yml'
	}, function (err, res) {
		if (res) {
			yml = Buffer.from(res.data.content, 'base64').toString()
			return chPage(github, owner, repo, yml)
		}
	})
}

//chCheckXML(github, owner, repo)
chCheckXML(github, 'TiagoDanin', 'TestGithub')

//chPage(github, owner, repo, yml)
//chPage(github, 'TiagoDanin', 'TestGithub', 'yml')

//chUpdateFile(github, path, code, message, branch, owner, repo)
//chUpdateFile(github, 'index.html', '<html><h1>Hello World!</h1></html>', 'TEST: UP', 'master', 'TiagoDanin', 'TestGithub')