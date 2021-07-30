const http = require("http");
const ejs = require("ejs");

require("dotenv").config();

const port = process.env.PORT;

const server = http.createServer((request, response) => {
    let test = [{name: "project 1"}, {name: "project 2"}, {name: "project 3"}];
    ejs.renderFile("templates/index.ejs", {projects: test}, {}, function (err, template) {
        if (err) {
            throw err;
        }
        else {
            response.setHeader('Content-Type', "text/html");
            response.end(template);
        }
    });
});

server.listen(port, () => {
    console.log(`Server running: listening ${port}`);
});