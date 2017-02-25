#!/usr/bin/env node

const bot = require("circle-github-bot").create();

demos = [
    bot.artifactLink("docs/index.html", "docs"),
];

bot.comment(`
<h3>${bot.env.commitMessage}</h3>
Preview: <strong>${demos.join(" | ")}</strong>
`);
