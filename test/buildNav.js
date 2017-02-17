function readStdin(callback) {
    let content = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.resume();
    process.stdin.on("data", (buf) => {
        content += buf;
    });
    process.stdin.on("end", () => {
        callback(content);
    });
}

const { createNavigableTree } = require("../dist/client");

readStdin((stdin) => {
    const docs = JSON.parse(stdin);
    const navigable = createNavigableTree(docs, docs.docs.nav);
    console.log(JSON.stringify(navigable, null, 2));
});
