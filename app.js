'use strict'

var Client = require('github')
var yaml = require('js-yaml');
var fs   = require('fs');
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
		hubdown('# Tiago\n\n-------\n\n`hello world`').then(readme_html => {
			site = site.format({
				title: config.title,
				description: config.description,
				lang: config.lang,
				repo: repo,
				size: config.size,
				watchers: 100,
				readme_html: readme_html.content
			}, true)
			fs.writeFileSync('index.html', site, 'utf8')
		});

		//console.log(config);
		//console.log(config.title)
		//console.log(config.desc)
		//console.log(config.template)
		//console.log(config.links)
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