// Description:
//   Open Pull Requests
//
// Commands:
//   hubot open prs
//
// Author:
//   Ana Cardoso
//
const request = require('request-promise');

const GITHUB_API = 'https://api.github.com';
const ORGANIZATION = process.env.GITHUB_ORGANIZATION;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const formatResponse = (repo_pulls) => {
	const repo = repo_pulls[0].head.repo;
	let response = `- Repository: ${repo.name} (${repo.html_url})\n`;

	repo_pulls.forEach(pull => {
		let pullResponse = `PR #${pull.number}: ${pull.title} (${pull.html_url})\n`;
		response = response.concat(pullResponse);
	});

	return response;
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

const getPulls = (repo_name) => {
	return request({
		url: `${GITHUB_API}/repos/${ORGANIZATION}/${repo_name}/` +
         `pulls?access_token=${GITHUB_TOKEN}`,
		headers: { 'User-Agent': 'request'}
	});
};

const replyOpenPullsByRepo = (res, repos) => {
	let reposPullsPromise = repos.map(repo => getPulls(repo.name));

	Promise.all(reposPullsPromise).then(repoPulls => {
		let reposWithOpenPulls = repoPulls.filter(pulls => pulls != '[]');
		let formattedPulls = reposWithOpenPulls.map(pulls => {
			return formatResponse(JSON.parse(pulls));
		});
		res.reply(formattedPulls.join('\n'));
	}).catch(error => replyError(res, error));
};

module.exports = (robot) => {
	robot.respond(/.open prs/i, (res) => {
		let getReposPromise = getRepos();
		getReposPromise.then(reposResponse => {
			let repos = JSON.parse(reposResponse);
			replyOpenPullsByRepo(res, repos);
		}).catch(error => replyError(res, error));
	});
};
