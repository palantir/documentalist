#!/usr/bin/env node

const bot = require("circle-github-bot").create();

const links = [
    bot.artifactLink("docs/index.html", "docs"),
].join(" | ").replace("circleci/documentalist", "circleci/project");
// string replace for Circle 2.0 changes

bot.comment(`
<h3>${bot.env.commitMessage}</h3>
Preview: <strong>${links}</strong>
`);
