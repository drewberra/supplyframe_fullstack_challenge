const express = require("express");
const request = require("request");


require("dotenv").config();

// Get the port that the server is going to run on from the environment variables
const port = process.env.PORT;

/************************************************************************************************************************
* Some functions based on example from: https://github.com/Supplyframe/had-api-example/blob/master/nodejs/server.js *
************************************************************************************************************************/

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
let apiData = {
    // clientId: process.env.OAUTH_CLIENT_ID,
    // clientSecret: process.env.OAUTH_CLIENT_SECRET,
    // apiKey: process.env.OAUTH_API_KEY
}

apiData.apiKey = process.env.OAUTH_API_KEY;
// apiData.apiKey = '?api_key=' + apiData.userKey;
apiData.apiUrl = 'https://api.hackaday.io/v1';
// apiData.apiAuthUrl = 'https://api.hackaday.io/v1/me' + apiData.apiKey;
// apiData.oAuthRedirect = 'https://hackaday.io/authorize?client_id=' + apiData.clientId + '&response_type=code';
// apiData.createTokenUrl = function (code) {
//     return ('https://auth.hackaday.io/access_token?' +
//     'client_id=' + this.clientId +
//     '&client_secret=' + this.clientSecret +
//     '&code=' + code +
//     '&grant_type=authorization_code');
// };

// apiData.oAuthToken = "";

let app = express();
app.set("views", __dirname + "/templates");
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    // Check if we oAuthToken, if not redirect the response so that we can receive one
    // if (!apiData.oAuthToken) {
    //     res.redirect(apiData.oAuthRedirect);
    //     return;
    // }

    let page = 1;
    if (req.query.page) {
        page = parseInt(req.query.page);
    }

    request.get(apiData.apiUrl + `/projects?api_key=${apiData.apiKey}&page=${page}`, function (err, res3, body) {
        let bodyData = parseJSON(body);
        if (!bodyData) {
            console.log('\nError parsing bodyData');
            return;
        }

        let pageInfo = {
            projects: bodyData.projects,
            page: page,
        };

        console.log(req.headers.return_projects_only);

        if (req.headers.return_projects_only !== undefined) {
            res.render("components/projects.ejs", {
                projects: bodyData.projects
            });
        }
        else {
            res.render("index.ejs", {
                projects: bodyData.projects,
                page: page,
            });
        }
    });
});
//
// app.get("/oauth_callback", (req, res) => {
//     console.log(1);
//     let code = req.query.code;
//     if (!code) {
//         return res.redirect('/');
//     }
//
//     console.log(2);
//     console.log('\nAccess code: ', code);
//
//     let postUrl = apiData.createTokenUrl(code);
//
//     console.log('\nPost Url: ', postUrl);
//
//     console.log(3);
//     request.post(postUrl, function (err, res2, body) {
//         let parsedData = parseJSON(body), token = null;
//
//         if (parsedData) {
//             token = parsedData.access_token;
//         }
//
//         if (!token) {
//             console.log('\nError parsing access_token: ', body);
//             return;
//             // return res.redirect('/');
//         }
//
//         console.log('\nToken: ', token);
//         apiData.oAuthToken = token;
//
//         res.redirect("/");
//     });
// });

app.listen(port, () => {
    console.log(`listening at: http://localhost:${port}/`);
});