'use strict';

// dependancies and global variables
require('dotenv').config();
require('ejs');
const cors = require('cors');
const PORT = process.env.PORT;
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');
const app = express();
const dataBaseUrl = process.env.DATABASE_URL;
const client = new pg.Client(dataBaseUrl);
client.on('error', (error) => {
  console.log(error);
});

//app
app.use(cors());
app.set('view engine', 'ejs');
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

//routes
app.get('/', renderHomePage);
app.get('/survey', renderSurvey);
app.post('/defineSession', handleChangeSession);

app.get('/history', handleAndDisplayHistory);
app.get('/error', handleError);
app.get('/getdata', getDataHandler)
app.get('*', handleUndefinedRoute);

//may become obsolete by now going back to TypeForm
var arrayOfSurveyResults = [];
// var arrayOfSessions = [];

function renderHomePage(request, response) {
  response.render('pages/index');
}
function renderSurvey(request, response) {
  response.render('pages/survey');
}
function getDataHandler(request, response) {
  let key = process.env.TYPE_FORM_KEY;
  const url = 'https://api.typeform.com/forms/hogWCP3L/responses';
  const header = `Authorization: Bearer ${key}`
  superagent.get(url)
    // .set(header)
    .then(results)
  console.log(results.body);
}

//may become obsolete by now going back to TypeForm
function handleChangeSession(request, response) {
  const currentSurveySession = request.body.text;
  //calling constructor with single argument of three parameters may cause problems.
  //removed this call to the instructor with comment for now.  Was for use with webhooks
  //and live updating a chart.  Right now we are focusing on single batch data API requests.
  // So instead we are just assigning a value to currentClassName for use within the API getData call handler.
  // arrayOfSurveyResults.push(new Survey(currentSurveySession));
  var currentClassName = currentSurveySession;
  // arrayOfSessions.push(currentSurveySession);
  // console.log('request.body: ', request.body);
  // console.log('request.body.text: ', request.body.text);
  // console.log('SurveyObject: ', arrayOfSurveyResults);

  response.status(200).render('pages/index');
}

function handleAndDisplayHistory(request, response) {
  //get previous data from database
  const sql = 'SELECT * FROM survey_results';
  client.query(sql)
    .then(incomingPreviousResults => {
      const allPreviousResults = incomingPreviousResults.rows;
      allPreviousResults.forEach( value => {
        const numArr = JSON.parse(value.results);
        arrayOfSurveyResults.push(new Survey(value.survey_instance,numArr));
      })
      response.status(200).send(arrayOfSurveyResults);
    })
    .catch( (error) => {
      console.log('An eror has occured: ',error);
      response.status(500).redirect('pages/error');
    })
}

function handleError(request, response) {
  console.log('An error has occured.');
  response.render('pages/error');
}

function handleUndefinedRoute(request, response) {
  response.status(404).send('#404: Page not found.')
}

function Survey(className, date_conducted, resultsArray) {
  this.surveySession = className;
  this.date_conducted = date_conducted;
  this.resultsArray = resultsArray || [];
}

client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Listening on ${PORT}`);
    });
  })
  .catch( (error) => {
    console.log('Sorry, something went wrong. We were unable to connect to the postres SQL database.',error);
    response.status(500).redirect('pages/error');
  });
