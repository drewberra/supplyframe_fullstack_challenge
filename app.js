const http = require("http");
const ejs = require("ejs");

const port = process.env.PORT;

const server = http.createServer((request, response) => {
    console.log("Nice request bro");
});

server.listen(port, () => {
    console.log(`Server running: listening ${port}`);
});