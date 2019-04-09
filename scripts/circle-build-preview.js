#!/usr/bin/env node
/**
 * @license Copyright 2019 Palantir Technologies, Inc. All rights reserved.
 */

const bot = require("circle-github-bot").create();

const ARTIFACTS = {
    "packages/docs/dist/index.html": "documentation",
};

if (!process.env.GH_AUTH_TOKEN) {
    // simply log artifact URLs if auth token is missed (typical on forks)
    Object.keys(ARTIFACTS).forEach(path => console.log(`${ARTIFACTS[path]}: ${bot.artifactUrl(path)}`))
    process.exit();
}

const links = Object.keys(ARTIFACTS).map(path => bot.artifactLink(path, ARTIFACTS[path])).join(" | ")
bot.comment(process.env.GH_AUTH_TOKEN, `
<h3>${bot.commitMessage()}</h3>
Preview: <strong>${links}</strong>
`);
