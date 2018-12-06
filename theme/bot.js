#!/usr/bin/env node

const bot = require("circle-github-bot").create();

const links = [
    bot.artifactLink("docs/index.html", "docs"),
].join(" | ")

if (process.env.GH_AUTH_TOKEN) {
    bot.comment(process.env.GH_AUTH_TOKEN, `
<h3>${bot.commitMessage()}</h3>
Preview: <strong>${links}</strong>
`);
} else {
    console.log("Unable to post comment.\n", links);
}
