'use strict'

var Client = require('github')
var fs   = require('fs');

var github = new Client({
	debug: false
})

github.authenticate({
	type: 'token',
	token: fs.readFileSync('token', 'utf8')
})