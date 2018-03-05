// Description:
//   Open Pull Requests
//
// Commands:
//   hubot open prs
//
const request = require('request-promise');

const GITHUB_API = 'https://api.github.com';
const ORGANIZATION = process.env.GITHUB_ORGANIZATION;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const formatResponse = repo_prs => {
	const repo = repo_prs[0].head.repo;
	let response = `\n*- Repository: ${repo.name}*\n`;

	let formattedPrs = repo_prs
		.map(pull => `PR #*${pull.number}*: ${pull.title} (${pull.html_url})`);

	return response += formattedPrs.join('\n');
};

const replyError = (res, error) => {
	let message = 'OH NO! I found an error! I was not able to find the open ' +
                `pull requests for ${ORGANIZATION} organization :(`;
	res.reply(`${message}\n- Error: ${error.error}`);
};

const getRepos = () => {
	return request({
		url: `${GITHUB_API}/orgs/${ORGANIZATION}/repos?access_token=${GITHUB_TOKEN}`,
		headers: { 'User-Agent': 'request' }
	});
};

const getPrs = repo_name => {
	return request({
		url: `${GITHUB_API}/repos/${ORGANIZATION}/${repo_name}/` +
         `pulls?access_token=${GITHUB_TOKEN}`,
		headers: { 'User-Agent': 'request'}
	});
};

const replyOpenPrsByRepo = (res, repos) => {
	let reposPrsPromise = repos.map(repo => getPrs(repo.name));

	Promise.all(reposPrsPromise).then(repoPrs => {
		let reposWithOpenPrs = repoPrs.filter(prs => prs != '[]');
		let formattedPrs = reposWithOpenPrs.map(prs => {
			return formatResponse(JSON.parse(prs));
		});
		res.reply(formattedPrs.join('\n'));
	}).catch(error => replyError(res, error));
};

module.exports = robot => {
	robot.respond(/.open prs/i, (res) => {
		let getReposPromise = getRepos();
		getReposPromise.then(reposResponse => {
			let repos = JSON.parse(reposResponse);
			replyOpenPrsByRepo(res, repos);
		}).catch(error => replyError(res, error));
	});
};
