const express = require('express');
const bodyParser = require('body-parser')
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
app.use(bodyParser.json())

// -----------------------------------------------------------------------------
// GET
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

app.get('/api/uom', checkJwt, async function(req, res) {
    let uom = await repo.get_uom();

    res.json(uom);
});

// ----------------------------------------------------------------------------
// POST
app.post('/api/saveGrocery', checkJwt, async function (req, res){
    await repo.save_grocery(req.body);
    res.json(req.body);
});

app.post('/api/saveRecipe', checkJwt, async function (req, res){
    let body = req.body;
    await repo.save_recipe(body.Name, body.GroceryTable);
    res.json(req.body);
});

app.post('/api/editGrocery', checkJwt, async function (req, res){
    let body = req.body;
    await repo.update_grocery(body.original, body.edited);
    res.json(req.body);
});

app.post('/api/editRecipe', async function(req, res) {
    let body = req.body;
    let resp = await repo.update_recipe(body.Name, body.GroceryTable);
    res.json(req.body);
});

// ----------------------------------------------------------------------------
let port = process.env.PORT;
if (port == null || port == "") {
	port = 5000;
}
app.listen(port, console.log(`Listening on port ${port}`));
