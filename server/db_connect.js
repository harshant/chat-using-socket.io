const request = require('request');
//var bodyParser = require('body-parser')

//app.use(bodyParser.urlencoded({ extended: false }));
const options = {
    method: 'POST',
    url: 'http://localhost:8080/v1alpha1/graphql',
    headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "X-Hasura-Access-Key": "bXlsadzdXBlc35nNlY3JldGtl678eWlueW91c09nNlcnZpY=-02VzaXIK"
    }
};

function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        //const info = JSON.parse(body);
        console.log(response.body.data.main[0].username);
        //console.log(info.data.main[0].username);
        //return response.body.data.main[0].username;
    }
}


module.exports = { options }