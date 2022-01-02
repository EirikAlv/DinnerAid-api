const express = require('express');
require('dotenv').config()
const { auth } = require("express-oauth2-jwt-bearer");
const checkJwt = auth({
  issuerBaseURL: process.env.ISSUER_URL,
  audience: process.env.AUDIENCE
});
const app = express();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.ENVIRONMENT === 'DEV' ? false : { rejectUnauthorized: false }
});

app.get("/api/external", checkJwt, (req, res) => {
  res.send({
    msg: "Your Access Token was successfully validated!"
  });
});

app.get('/', (req, res) => {
    res.send({data: 'hello there'});
});

app.get('/db', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM test_table');
    const results = { 'results': (result) ? result.rows : null};
    res.send(results);
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
})


let port = process.env.PORT;
if (port == null || port == "") {
  port = 5000;
}
app.listen(port, console.log(`Listening on port ${port}`));
