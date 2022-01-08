require('dotenv').config()
const { Pool } = require('pg');
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: process.env.ENVIRONMENT === 'DEV' ? false : { rejectUnauthorized: false }
});

let foo = process.env.ENVIRONMENT;
module.exports = {
    get_test_table: async function() {
        try {
            const client = await pool.connect();
            const result = await client.query('SELECT * FROM test_table');
            const results = { 'results': (result) ? result.rows : null};
            client.release();
            return(results);
		} catch (err) {
			console.error(err);
			return("Error " + err);
		}
    },
    get_groceries_list: async function() {
		try {
			const client = await pool.connect();
            const result = await client.query(
				`SELECT 
					Norwegian, 
					English, 
					Section,
					standard_quantity,
					u.name AS UOM
				FROM 
					groceries
				LEFT JOIN unit_of_mesure u
					ON unit_of_mesure = u.id
				`);
            // const results = { 'results': (result) ? result.rows : null};
            client.release();
            return(result?.rows);
		} catch (err) {
			console.error(err);
			return("Error " + err);
		}
    },
	get_grocery: async function(name) {
		try {
			const client = await pool.connect();
            const result = await client.query(
				`SELECT 
					*
				FROM 
					groceries
				WHERE english = $1
				`, [name]);
            // const results = { 'results': (result) ? result.rows : null};
            client.release();
            return(result?.rows);
		} catch (err) {
			console.error(err);
			return("Error " + err);
		}
	},
	get_all_recipes: async function() {
		try {
			const client = await pool.connect();

			let names = (await client.query(`SELECT * FROM recipes_names`))?.rows;

        	let ids = (await client.query('SELECT DISTINCT recipe_id FROM recipes'))?.rows.map(x => x.recipe_id);

			let newOut = [];
			for (const el of ids) {
				o = {}
				o['Name'] = names.find(n => n.id === el).name;
				let response = (await client.query(`
					SELECT 
						g.Norwegian, 
						g.English, 
						g.Section, 
						g.standard_quantity, 
						uom.name as UOM,
						amount 
					FROM recipes 
					LEFT JOIN groceries g
						ON g.id = grocerie_id
					LEFT JOIN unit_of_mesure uom
						ON uom.id = g.unit_of_mesure
					WHERE recipe_id = ${el}; 
				`))?.rows
				
				o['Table'] = response;
				newOut.push(o);
			}
            
            client.release();
            return(newOut);
		} catch (err) {
			console.error(err);
			return("Error " + err);
		}
	},
	
}