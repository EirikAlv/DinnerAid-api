const express = require('express');
const repo = require('./repository')
require('dotenv').config()

//CORS
var cors = require('cors');
const corsOptions ={
	origin: process.env.UI_BASE_URL, 
	credentials:true,            //access-control-allow-credentials:true
	optionSuccessStatus:200
}

const { auth } = require("express-oauth2-jwt-bearer");
const checkJwt = auth({
	issuerBaseURL: process.env.ISSUER_URL,
	audience: process.env.AUDIENCE
});


const app = express();
app.use(cors(corsOptions));


app.get("/api/external", checkJwt, (req, res) => {
	res.send({
		msg: "Your Access Token was successfully validated!"
	});
});

app.get('/', (req, res) => {
    res.send({data: 'hello there'});
});

app.get('/api/db', checkJwt, async (req, res) => {
	res.send(await repo.get_test_table());
})

app.get('/api/groceries', checkJwt, async (req, res) => {
	res.json(await repo.get_groceries_list());
})

app.get('/api/recipes', checkJwt, async (req, res) => {
	res.json(await repo.get_all_recipes());
})

app.get('/api/grocery/:name', checkJwt, async function(req, res) {
    let name = req.params.name; 
    const grocery = await repo.get_grocery(name);

    res.json(grocery);
})


let port = process.env.PORT;
if (port == null || port == "") {
	port = 5000;
}
app.listen(port, console.log(`Listening on port ${port}`));
