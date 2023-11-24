import { Octokit } from '@octokit/rest';
import fs from 'fs';
import * as CSV from 'csv-string';
import { initialDate, lastURL } from './state.js';

const octokit = new Octokit({
  auth: process.env.AUTH,
  userAgent: 'amazonisburning',
});

const env = process.env.NODE_ENV || 'development';

async function getFileData(fileName) {
  try {
    const { data } = await octokit.request(
      `GET /repos/mugasparetto/amazonisburning-files/contents/${fileName}`,
      {
        owner: 'mugasparetto',
        repo: 'amazonisburning-files',
        path: `${fileName}`,
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
    const { content } = await getFileData(`config-${env}.json`);

    const config = JSON.parse(Buffer.from(content, 'base64').toString('utf8'));

    return config;
  } catch (error) {
    console.log(error);
  }
}

async function getWildfiresFile() {
  try {
    const { content } = await getFileData(`wildfires-${env}.csv`);
    const str = Buffer.from(content, 'base64').toString('utf8');

    return CSV.parse(str);

    // const config = JSON.parse(Buffer.from(content, 'base64').toString('utf8'));

    // return config;
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

    const { sha } = await getFileData(`config-${env}.json`);

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

function updateAllWildfiresFile() {
  async function sendToGit() {
    try {
      const csv = await fs.promises.readFile('./src/all_wildfires.csv', {
        encoding: 'base64',
      });

      const { sha } = await getFileData(`wildfires-${env}.csv`);

      await octokit.rest.repos.createOrUpdateFileContents({
        owner: 'mugasparetto',
        repo: 'amazonisburning-files',
        path: `wildfires-${env}.csv`,
        sha: sha,
        message: 'wildfires updated',
        content: csv,
      });
    } catch (error) {
      console.log(error);
    }
  }

  setTimeout(sendToGit, 500); //github does not allow uploading two files Consecutively, so I added a quick delay
}

export {
  getInitialState,
  updateConfigFile,
  updateAllWildfiresFile,
  getWildfiresFile,
};
