const yaml = require('js-yaml')
const jformat = require('jformat')
const hubdown = require('hubdown')
const dateTime = require('node-datetime')
const bytelabel = require('bytelabel')

module.exports = (app) => {
	app.log('Yay, the app was loaded!')

	const createFile = () => {
		log(`[+] chUpdateFile: +github, ${path}, +code, ${message}, ${branch}, ${owner}, ${repo}`)
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

		github.repos.getContents({
			owner: owner,
			repo: repo,
			path: path,
			ref: 'refs/heads/' + branch + ''
		}).then((res) => {
			var sha = res.data.sha
			var content = Buffer.from(res.data.content, 'base64').toString()
			if (content == code) {
				log('[+] Same updateFile')
				return
			}
			param.sha = sha
			return github.repos.updateFile(param)
		}).catch(() => github.repos.createFile(param))
	}

	const checkRepo = (github, repo) => {
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
				var readme_data = await github.repos.getContents({
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
				var iframe_data = await github.repos.getContents({
					owner: owner,
					repo: repo_name,
					path: config.iframe || 'iframe.html'
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

	app.on([
		'installation',
		'installation_repositories',
		'integration_installation_repositories'
	], async (ctx) => {
		var repositories = []
		if (ctx.payload) {
			if (ctx.payload.repositories) {
				repositories = ctx.payload.repositories
			} else if (ctx.payload.repositories_added) {
				repositories = ctx.payload.repositories_added
			}
		}
		for (var repo of repositories) {
			await checkRepo(ctx.github, {
				owner: repo.full_name.replace(`/${repo.name}`, ''),
				repo: repo.name
			})
		}
		return
	})

	app.on('push', async (ctx) => {
		return await checkRepo(ctx.github, ctx.repo({}))
	})
}
