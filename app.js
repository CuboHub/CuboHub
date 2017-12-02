'use strict'

var Client  = require('github')
var fs      = require('fs');
var yaml    = require('js-yaml');
var jformat = require('jformat');
var hubdown = require('hubdown')

var github = new Client({
	debug: false
})

github.authenticate({
	type: 'token',
	token: fs.readFileSync('token', 'utf8')
})

function chUpdateFile(github, path, code, message, branch, owner, repo) {
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
				console.log(err, res)
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
				console.log(err, res)
			})
		}
	})
}

function chPage(github, owner, repo, yml) {
	try {
		var config = yaml.safeLoad(fs.readFileSync('cubohub.yml', 'utf8'));
		var site = yaml.safeLoad(fs.readFileSync('defaut.html', 'utf8'));
		var readme_html = hubdown('# Tiago\n\n-------\n\n`hello world`')

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
			size: config.size || repo.size,
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
			content_html: readme_html + iframe_html
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

		fs.writeFileSync('index.html', site, 'utf8')

	} catch (e) {
		console.log(e);
	}
}

function chCheckXML(github, owner, repo) {
	github.repos.getContent({
		owner: owner,
		repo: repo,
		path: '.github/cuboHub.xml'
	}, function (err, res) {
		if (res) {
			yml = Buffer.from(res.data.content, 'base64').toString()
			return chPage(github, owner, repo, yml)
		}
	})
	github.repos.getContent({
		owner: owner,
		repo: repo,
		path: '.github/CuboHub.xml'
	}, function (err, res) {
		if (res) {
			yml = Buffer.from(res.data.content, 'base64').toString()
			return chPage(github, owner, repo, yml)
		}
	})
	github.repos.getContent({
		owner: owner,
		repo: repo,
		path: 'cuboHub.xml'
	}, function (err, res) {
		if (res) {
			yml = Buffer.from(res.data.content, 'base64').toString()
			return chPage(github, owner, repo, yml)
		}
	})
	github.repos.getContent({
		owner: owner,
		repo: repo,
		path: 'CuboHub.xml'
	}, function (err, res) {
		if (res) {
			yml = Buffer.from(res.data.content, 'base64').toString()
			return chPage(github, owner, repo, yml)
		}
	})
	github.repos.getContent({
		owner: owner,
		repo: repo,
		path: '.cuboHub.xml'
	}, function (err, res) {
		if (res) {
			yml = Buffer.from(res.data.content, 'base64').toString()
			return chPage(github, owner, repo, yml)
		}
	})
	github.repos.getContent({
		owner: owner,
		repo: repo,
		path: '.CuboHub.xml'
	}, function (err, res) {
		if (res) {
			yml = Buffer.from(res.data.content, 'base64').toString()
			return chPage(github, owner, repo, yml)
		}
	})
}

//chPage(github, owner, repo, yml)
chPage(github, 'TiagoDanin', 'TestGithub', 'yml')

//chCheckXML(github, owner, repo)
//chCheckXML(github, 'TiagoDanin', 'TestGithub')

//chUpdateFile(github, path, code, message, branch, owner, repo)
//chUpdateFile(github, 'index.html', '<html><h1>Hello World!</h1></html>', 'TEST: UP', 'master', 'TiagoDanin', 'TestGithub')