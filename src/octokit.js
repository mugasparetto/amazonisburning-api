import { Octokit } from '@octokit/rest';
import { lastURL } from './state.js';

const octokit = new Octokit({
  auth:
    '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',
  userAgent: 'amazonisburning',
});

const { CONFIG_FILE } = process.env;

async function getFileData() {
  try {
    const { data } = await octokit.request(
      `GET /repos/mugasparetto/amazonisburning-files/contents/${CONFIG_FILE}.json`,
      {
        owner: 'mugasparetto',
        repo: 'amazonisburning-files',
        path: `${CONFIG_FILE}.json`,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    return data;
  } catch (error) {
    console.log(error);
  }
}

async function getInitialState() {
  try {
    const { content } = await getFileData();

    const config = JSON.parse(Buffer.from(content, 'base64').toString('utf8'));

    return config;
  } catch (error) {
    console.log(error);
  }
}

async function updateInitialDate(newInitialDate) {
  try {
    const string = JSON.stringify({
      initial_date: newInitialDate,
      last_url: lastURL,
    });
    const newContent = Buffer.from(string, 'utf8').toString('base64');

    const { sha } = await getFileData();

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: 'mugasparetto',
      repo: 'amazonisburning-files',
      path: `${CONFIG_FILE}.json`,
      sha: sha,
      message: 'initial_date updated',
      content: newContent,
    });
  } catch (error) {
    console.log(error);
  }
}

export { getInitialState, updateInitialDate };
