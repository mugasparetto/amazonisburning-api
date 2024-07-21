<div align="center">
  <h2>Amazon is burning</h2>
  <img alt="GitHub" src="https://img.shields.io/badge/license-MIT-green"> <img alt="GitHub top language" src="https://img.shields.io/github/languages/top/mugasparetto/amazonisburning-client">
</div>

------------

<p align="center">
  <a href="#pencil-about">About</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#link-deployed-version">Deployed version</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#hammer_and_wrench-features">Features</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#space_invader-technologies">Technologies</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#rocket-getting-started">Getting started</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
    <a href="#heavy_check_mark-next-steps">Next steps</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#page_facing_up-license">License</a>
</p>

------------

## :pencil: About
Amazon is Burning is a project that tracks wildfires in the Amazon rainforest. The count is associated with a point in time — typically an event — creating emotional proximity to the audience.

## :link: Deployed version
Live version can be found at [amazonisburning.com](https://amazonisburning.com/)<br />
It was deployed using [Netlify](https://www.netlify.com/)

## :hammer_and_wrench: Features
* Retrieving data from [Brazilian government wildfires database](https://terrabrasilis.dpi.inpe.br/queimadas/portal/)
* Checking if wildfire is within Amazon rainforest area
* Filtering wildfires by sattelite
* Storing relevant data
* Tracking number of wildfire occurences
* Websocket for live-stream data
* Route POST for new reference point in time
* Route GET for all wildfires

## :space_invader: Technologies
- [Node.js](https://nodejs.org/en/)
- [Express](https://expressjs.com/pt-br/)
- [Socket.io](https://socket.io/)
- [Octokit](https://github.com/octokit)

## :rocket: Getting started

### Requirements
- [Node.js](https://nodejs.org/en/)
- [Yarn](https://classic.yarnpkg.com/) or [npm](https://www.npmjs.com/)

### Clone the project
```bash
$ git clone https://github.com/mugasparetto/amazonisburning-client.git && cd amazonisburning-client
```

### Run these commands
```bash
# Install the dependencies
$ yarn

# Make a copy of '.env.example' as '.env' and set your environment variables related to the GitHub auth.
$ cp .env.example .env

# Run the api service
$ yarn dev:server
```

## :heavy_check_mark: Next steps
- [ ] Get 100% on test coverage
- [ ] Change storage from GitHub to services like Mongo or Supabase
- [ ] Optimise algorithm that checks if wildfire is inside Amazon rainforest
- [ ] Optimise GET route for all wildfires

## :page_facing_up: License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with 💜 &nbsp;by Murilo Gasparetto 👋 &nbsp;[Get in touch](https://www.linkedin.com/in/mugasparetto/)
