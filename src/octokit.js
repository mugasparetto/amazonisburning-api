import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth:
    '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',
  userAgent: 'amazonisburning',
});

async function getInitialState() {
  try {
    const { data } = await octokit.request(
      'GET /repos/mugasparetto/amazonisburning-files/contents/config-dev.json',
      {
        owner: 'mugasparetto',
        repo: 'amazonisburning-files',
        path: 'config-dev.json',
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    const config = JSON.parse(
      Buffer.from(data.content, 'base64').toString('utf8')
    );

    return config;
  } catch (error) {
    console.log(error);
  }
}

export { getInitialState };
