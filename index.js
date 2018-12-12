const axios = require('axios')
const yaml = require('js-yaml')
const jformat = require('jformat')
const hubdown = require('hubdown')
const bytelabel = require('bytelabel')
const dateTime = require('node-datetime')
const getConfig = require('probot-config')

module.exports = (app) => {
	app.log('Yay, the app was loaded!')

	const cubohub = 'Created with <a href="https://CuboHub.github.io" target="_blank">CuboHub</a>'

	const request = async (url) => {
		return await axios({
			method: 'GET',
			url: url,
		}).then((res) => {
			if (res.data) {
				return res.data.toString()
			}
			return ''
		}).catch(() => {
			return ''
		})
	}

	const done = async (ctx, github, params) => {
		app.log(`[+] Check Repo: +ctx, +github, (${params.owner}, ${params.name})`)

		var config = await getConfig(ctx, 'cubohub.yml')
		var dataTimeNow = dateTime.create()
		var repo = await github.repos.get(params)
		repo = repo.data

		app.log(config)

		var site = await request(config.template)

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
		app.log(repo)
		seo = seo.format({
			author: config.seo['author'] || params.owner,
			description: config.seo['description'] || config.description,
			keywords: config.seo['keywords'] || repo.name,
			title: config.seo['title'] || config.title || repo.name,
			image: config.seo['image'] || '',
			url: config.seo['url'] || '',
			site_name: config.seo['site_name'] || config.title || repo.name,
			twitter_card: config.seo['twitter_card'] || ''
		}, true)

		var links = []
		for (var index in (config.links || {})) {
			links.push({
				title: index.toString(),
				href: links[index]
			})
		}

		var readmeMd = ''
		if (config.readme) {
			if (config.readme === true) {
				config.readme = 'README.md'
			}
			if (!config.readme === true) {
				readmeMd == ''
			} else {
				var readmeData = await github.repos.getContents({
					...params,
					path: config.readme || 'README.md'
				}).catch((err) => {
					//TODO Log of error
					return {
						data: {
							content: ''
						}
					}
				})
				readmeMd = Buffer.from(readmeData.data.content, 'base64').toString()
			}
		}

		var iframeHtml = ''
		if (config.iframe) {
			if (config.iframe === true) {
				config.iframe = 'iframe.html'
			}
			if (!config.iframe === true) {
				iframeHtml = ''
			} else {
				var iframeData = await github.repos.getContents({
					...params,
					path: config.iframe || 'iframe.html'
				}).catch((err) => {
					//TODO Log of error
					return {
						data: {
							content: ''
						}
					}
				})
				iframeHtml = Buffer.from(iframeData.data.content, 'base64').toString()
			}
		}

		var readmeHtml = await hubdown(readmeMd)
		readmeHtml = readmeHtml.content
		var contentHtml = readmeHtml + iframeHtml

		var sizeRepoKb = (config.size || repo.size) * 1024
		var sizeRepo = bytelabel(sizeRepoKb, {
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
			size: sizeRepo,
			size_kb: sizeRepoKb,
			watchers: repo.watchers || '0',
			forks_count: repo.forks_count || '0',
			fork: repo.forks_count || '0',
			stargazers_count: repo.stargazers_count || '0',
			stars: repo.stargazers_count || '0',
			readme_md: readmeMd || '',
			readme: readmeHtml || '',
			readme_html: readmeHtml || '',
			iframe_html: iframeHtml || '',
			iframe: iframeHtml || '',
			created_at: repo.created_at,
			updated_at: repo.updated_at,
			pushed_at: repo.pushed_at,
			content_html: contentHtml,
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
			links: links,
			template: config.template,
			cubohub: cubohub
		}
		site = site.format(info, true)

		var dataTimeNowStr = dataTimeNow.format('m/d/Y H:M')
		params.message = `Update GitHub Page: ${dataTimeNowStr}`
		if (config.cmessage) {
			params.message = config.cmessage
		}

		if (config.gitauthor) {
			if (config.gitauthor.name && config.gitauthor.email) {
				var gitauthor = {}
				gitauthor.name = config.gitauthor.name
				gitauthor.email = config.gitauthor.email
				params.author = gitauthor
				params.committer = gitauthor
			}
		}

		params.path = 'index.html'
		params.branch = 'gh-pages'
		params.ref = `refs/heads/${params.branch}`
		params.content = Buffer.from(site).toString('base64')
		return await github.repos.getContents({
			owner: params.owner,
			repo: params.repo,
			path: params.path,
			ref: params.ref
		}).then((res) => {
			params.sha = res.data.sha
			var content = Buffer.from(res.data.content, 'base64').toString()
			if (content == site) {
				return
			}
			return github.repos.updateFile({
				owner: params.owner,
				repo: params.repo,
				path: params.path,
				sha: params.sha,
				message: params.message,
				content: params.content,
				branch: params.branch,
				committer: params.committer,
				author: params.author
			})
		}).catch(() => {
			return github.repos.createFile({
				owner: params.owner,
				repo: params.repo,
				path: params.path,
				message: params.message,
				content: params.content,
				branch: params.branch,
				committer: params.committer,
				author: params.author
			})
		})
		app.log('[+] Done')
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
			await done(ctx, ctx.github, {
				owner: repo.full_name.replace(`/${repo.name}`, ''),
				repo: repo.name
			})
		}
		return
	})

	app.on('push', async (ctx) => {
		return await done(ctx, ctx.github, ctx.repo({}))
	})
}
