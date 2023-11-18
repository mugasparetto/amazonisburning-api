import { Octokit } from '@octokit/rest';
import { initialDate, lastURL } from './state.js';

const octokit = new Octokit({
  auth:
    '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',
  userAgent: 'amazonisburning',
});

var env = process.env.NODE_ENV || 'development';

async function getFileData() {
  try {
    const { data } = await octokit.request(
      `GET /repos/mugasparetto/amazonisburning-files/contents/config-${env}.json`,
      {
        owner: 'mugasparetto',
        repo: 'amazonisburning-files',
        path: `config-${env}.json`,
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

async function updateConfigFile({ key, data }) {
  try {
    let string;
    console.log(data);

    if (key === 'initial_date') {
      string = JSON.stringify({
        initial_date: data,
        last_url: lastURL || '',
      });
    } else if (key === 'last_url') {
      string = JSON.stringify({
        initial_date: initialDate,
        last_url: data,
      });
    }

    const newContent = Buffer.from(string, 'utf8').toString('base64');

    const { sha } = await getFileData();

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: 'mugasparetto',
      repo: 'amazonisburning-files',
      path: `config-${env}.json`,
      sha: sha,
      message: `${key} updated`,
      content: newContent,
    });
  } catch (error) {
    console.log(error);
  }
}

export { getInitialState, updateConfigFile };
