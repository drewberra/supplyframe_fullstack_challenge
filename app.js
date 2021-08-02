const express = require("express");
const request = require("request");

require("dotenv").config();

// Get the port that the server is going to run on from the environment variables
const port = process.env.PORT;

/********************************************************************************************************************
* Some functions based on example from: https://github.com/Supplyframe/had-api-example/blob/master/nodejs/server.js *
********************************************************************************************************************/

function parseJSON (value) {
    let parsed;
    try {
        parsed = JSON.parse(value);
    } catch (e) {
        console.log('Error parsing JSON: ', e, '\nInput: ', value);
    }
    return parsed || false;
}

// Initialize the object that contains the info to build the api so that we can make requests
let apiData = {}
apiData.apiKey = process.env.OAUTH_API_KEY;
apiData.apiUrl = 'https://api.hackaday.io/v1';

let app = express();

app.use("/styles", express.static("styles/css"));

app.set("views", __dirname + "/templates");
app.set("view engine", "ejs");

// Hashmap of user info by their id that we are using for localstorage
// In a production setting we would want to store this in a database of some sort and make sure that we are updating the user information frequently
let users = {};

app.get("/", (req, res) => {
    let page = 1;
    if (req.query.page) {
        page = parseInt(req.query.page);
    }

    let sortBy = "newest";
    let validSortBy = ["skulls", "newest", "views", "comments", "followers", "updated"];
    if (req.query.sortby && validSortBy.includes(req.query.sortby)) {
        sortBy = req.query.sortby;
    }

    request.get(apiData.apiUrl + `/projects?page=${page}&sortby=${sortBy}&api_key=${apiData.apiKey}`, function (err, res2, body) {
        let bodyData = parseJSON(body);
        if (!bodyData) {
            console.log('\nError parsing bodyData');
            return;
        }

        let projects = bodyData.projects;

        let userIdQueryString = "";
        let userIdsToGet = new Set();
        for (let i=0; i < projects.length; ++i) {
            let userId = projects[i].owner_id;
            if (!(userId in users) && !userIdsToGet.has(userId)) {
                userIdsToGet.add(userId);
                userIdQueryString += `${userId},`;
            }
        }

        if (userIdsToGet.size > 0) {
            request.get(`${apiData.apiUrl}/users/batch?ids=${userIdQueryString.slice(0, -1)}&api_key=${apiData.apiKey}`, function (err, res3, body) {
                let userResBody = parseJSON(body);
                if (!userResBody) {
                    console.log('\nError parsing bodyData');
                    return;
                }

                for (let i=0; i < userResBody.users.length; ++i) {
                    users[userResBody.users[i].id] = userResBody.users[i];
                }

                for (let i=0; i < projects.length; ++i) {
                    let project = projects[i];
                    project.owner_meta_data = users[project.owner_id];
                    projects[i] = project;
                }

                if (req.headers.return_projects_only !== undefined) {
                    res.render("components/projects.ejs", {
                        projects: projects
                    });
                }
                else {
                    res.render("index.ejs", {
                        projects: projects,
                        page: page
                    });
                }
            });
        }
        else {
            for (let i=0; i < projects.length; ++i) {
                let project = projects[i];
                project.owner_meta_data = users[project.owner_id];
                projects[i] = project;
            }

            if (req.headers.return_projects_only !== undefined) {
                res.render("components/projects.ejs", {
                    projects: projects
                });
            }
            else {
                res.render("index.ejs", {
                    projects: projects,
                    page: page
                });
            }
        }
    });
});

app.get("/project/:id", async (req, res) => {
    let projectId = req.params.id;

    request.get(`${apiData.apiUrl}/projects/${projectId}?api_key=${apiData.apiKey}`, async function (err, res2, body) {
        let projectInfo = parseJSON(body);
        if (!projectInfo) {
            console.log('\nError parsing bodyData');
            return;
        }

        console.log(`Tags: ${projectInfo.tags}`);

        let relatedProjects = [];
        let promiseArray = [];
        for (let i=0; i < projectInfo.tags.length; ++i) {
            promiseArray.push(
                searchForProjectsByTag(
                    projectInfo.tags[i],
                    function (projectsWithMatchingTag) {
                        relatedProjects = relatedProjects.concat(projectsWithMatchingTag);
                    }
                )
            );
        }

        if (projectInfo.owner_id in users) {
            projectInfo.owner_meta_data = users[projectInfo.owner_id];
        }
        else {
            console.log("hi");
            promiseArray.push(
                getProjectOwnerInfo(
                    projectInfo.owner_id,
                    function () {
                        projectInfo.owner_meta_data = users[projectInfo.owner_id];

                        console.log(projectInfo);
                    }
                )
            );
        }

        Promise.all(promiseArray).then(function () {
            let relatedProjectsHash = {};
            for (let i=0; i < relatedProjects.length; ++i) {
                if (!(relatedProjects[i].id in relatedProjectsHash)) {
                    relatedProjectsHash[relatedProjects[i].id] = relatedProjects[i];
                }
            }

            projectInfo.relatedProjects = Object.values(relatedProjectsHash);

            res.render("project_page.ejs", {
                project: projectInfo
            });
        })
    });
});

app("user/:id/tooltip/", (req, res) => {
    let projectId = req.params.id;

    console.log(projectId);
    console.log(typeof projectId);

    projectId = parseInt(projectId);
});

function getProjectOwnerInfo(ownerId, callback) {
    return new Promise(((resolve, reject) => {
        request.get(`${apiData.apiUrl}/users/${ownerId}?api_key=${apiData.apiKey}`, (err, res2, body) => {
            if (err) {
                reject(err);
            }

            let userInfo = parseJSON(body);
            if (!userInfo) {
                console.log('\nError parsing bodyData');

                callback();

                resolve(body);
                return;
            }

            users[userInfo.id] = userInfo;

            callback();

            resolve(body);
        });
    }));
}

// function that searches for projects by tagName
// arguments - tagName:str, callback:func
// returns any matching projects found via the callback
function searchForProjectsByTag(tagName, callback) {
    return new Promise(((resolve, reject) => {
        request.get(`${apiData.apiUrl}/projects/search?search_term=${tagName}&api_key=${apiData.apiKey}`, function (err, res, body) {
            if (err) {
                reject(err);
            }

            let searchResults = parseJSON(body);
            if (!searchResults) {
                console.log('\nError parsing bodyData');
                reject("Error parsing bodyData");
                return;
            }

            let projects = searchResults.projects;

            let relatedProjects = [];
            for (let i=0; i < projects.length; ++i) {
                if(projects[i].tags && projects[i].tags.includes(tagName)) {
                    relatedProjects.push(projects[i]);
                }
            }

            callback(relatedProjects);
            resolve(body);
        });
    }))
}

app.listen(port, () => {
    console.log(`listening at: http://localhost:${port}/`);
});