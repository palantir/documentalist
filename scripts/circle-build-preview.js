#!/usr/bin/env node
/**
 * @license Copyright 2019 Palantir Technologies, Inc. All rights reserved.
 */

const bot = require("circle-github-bot").create();

/**
 * @type {Array<{path: string; url: string;}>}
 */
 const artifacts = require("./artifacts.json").items;

 const ARTIFACTS = {
     documentation: "packages/docs/dist/index.html",
 };

if (!process.env.GH_AUTH_TOKEN) {
    // simply log artifact URLs if auth token is missed (typical on forks)
    Object.keys(ARTIFACTS).forEach(package => console.info(`${ARTIFACTS[package]}: ${getArtifactAnchorLink(package)}`));
    process.exit();
}

const links = Object.keys(ARTIFACTS).map(getArtifactAnchorLink).join(" | ");
bot.comment(
    process.env.GH_AUTH_TOKEN,
    `
<h3>${bot.commitMessage()}</h3>
Previews: <strong>${links}</strong>
`,
);

function getArtifactAnchorLink(package) {
    const artifactInfo = artifacts.find(a => a.path === ARTIFACTS[package]);
    return `<a href="${artifactInfo.url}">${package}</a>`;
}
