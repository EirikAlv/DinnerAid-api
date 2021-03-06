require('dotenv').config()
const { Pool } = require('pg');
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: process.env.ENVIRONMENT === 'DEV' ? false : { rejectUnauthorized: false }
});


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
					g.id,
					g.Norwegian, 
					g.English, 
					g.Section,
					g.standard_quantity,
					u.name AS UOM
				FROM 
					groceries as g
				LEFT JOIN unit_of_mesure u
					ON unit_of_mesure = u.id
				`);
            client.release();
            return(result?.rows);
		} catch (err) {
			console.error(err);
			return("Error " + err);
		}
    },
	get_groceries_with_id: async function() {
		try {
			const client = await pool.connect();
            const result = await client.query(
				`SELECT 
					*
				FROM 
					groceries
				`);
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
					g.id,
					Norwegian, 
					English, 
					Section,
					standard_quantity,
					u.name AS UOM
				FROM 
					groceries as g
				LEFT JOIN unit_of_mesure u
				ON unit_of_mesure = u.id
				WHERE norwegian = $1
				`, [name]);
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
						g.id,
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
					WHERE recipe_id = $1; 
				`, [el]))?.rows
				
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
	get_recipe_by_name: async function(recipe_name) {
		try {
			const client = await pool.connect();
            const result = await client.query(
				`SELECT 
					*
				FROM 
					recipes_names
				WHERE name =  $1; 
				`, [recipe_name]);
            client.release();
            return(result?.rows);
		} catch (err) {
			console.error(err);
			return("Error " + err);
		}
	},
	get_uom: async function() {
		try {
			const client = await pool.connect();
            const result = await client.query(
				`SELECT 
					*
				FROM 
					unit_of_mesure
				`);
            client.release();
            return(result?.rows);
		} catch (err) {
			console.error(err);
			return("Error " + err);
		}
	},
	get_uom_by_name: async function(name) {
		try {
			const client = await pool.connect();
            const result = await client.query(
				`SELECT 
					*
				FROM 
					unit_of_mesure
				WHERE name =  $1; 
				`, [name]);
            client.release();
            return(result?.rows);
		} catch (err) {
			console.error(err);
			return("Error " + err);
		}
	},
	search_recipes: async function(groceries) {
		const all_recipes = await this.get_all_recipes();

		const res = all_recipes.filter(recipe => {
			return groceries.every(g => {
				let found_grocery = recipe.Table.find(x => x.id === g.id);
				if (found_grocery) {
					return found_grocery.amount >= g.amount
				}

				return false;
			});
		});

		return res;
	},

	// --------------------------------------------------------------------------------------
	// INSERT
	save_grocery: async function(grocery) {
        let editedUOMId = (await this.get_uom_by_name(grocery.uom))[0]?.id;
        try {
			const values = [grocery.norwegian, grocery.english, grocery.section, editedUOMId, grocery.standard_quantity]
			const client = await pool.connect();
            const result = await client.query(
				`INSERT INTO groceries(id, norwegian, english, section, unit_of_mesure, standard_quantity)
				VALUES (DEFAULT, $1, $2, $3, $4, $5)`, values);
            client.release();
            return(result?.rows);
		} catch (err) {
			console.error(err);
			return("Error " + err);
		}
    },
	save_recipe_name: async function(recipe_name) {
		try {
			const client = await pool.connect();
            const result = await client.query(
				`INSERT INTO recipes_names(name)
				VALUES ($1) RETURNING *`, [recipe_name]);
            client.release();
            return(result?.rows);
		} catch (err) {
			console.error(err);
			return("Error " + err);
		}
	},
	save_recipe: async function(recipeName, groceries) {
        let recipeId = -1;
        let response = await (this.get_recipe_by_name(recipeName))[0];
        if (response) {
            recipeId = response.id;
        } else {
            recipeId = (await this.save_recipe_name(recipeName))[0].id;
        }

		let grocery_table = await this.get_groceries_with_id();
        let new_groceries = groceries.map(x => {
            let found = grocery_table.find(y => y.norwegian === x.norwegian);
            found.amount = !isNaN(parseInt(x.amount)) ? x.amount : 0;
            return found; 
        });
		
        try {
			const client = await pool.connect();
			const values = new_groceries.map(x => [recipeId, x.id, x.amount]);
			
			
			for (const x of values) {
				await client.query(
					`INSERT INTO recipes(recipe_id, grocerie_id, amount)
					VALUES ($1, $2, $3)`, x);
			}
            client.release();
		} catch (err) {
			console.error(err);
			return("Error " + err);
		}
    },

	// UPDATE
	update_grocery: async function(original, edited) {
		const uom_id = (await this.get_uom_by_name(edited.uom))[0].id;

		const set_values = [
			edited.norwegian,
			edited.english,
			edited.section,
			uom_id,
			edited.standard_quantity,
			original.norwegian,
		]

		try {
			const client = await pool.connect();
            const result = await client.query(
				`UPDATE groceries
				SET Norwegian = $1,
					English = $2,
					Section = $3,
					unit_of_mesure = $4,
					standard_quantity = $5
				WHERE
					norwegian = $6`, set_values);
            client.release();
            return(result?.rows);
		} catch (err) {
			console.error(err);
			return("Error " + err);
		}
	}, 
	update_recipe: async function(recipeName, groceries) {
		let existing_recipe = (await this.get_recipe_by_name(recipeName))[0];
		if (!existing_recipe) {
            return {success: false};
        }
		
		let lines = groceries.map(x => [existing_recipe.id, x.id, x.amount])
		
		try {
			const client = await pool.connect();
            const result = await client.query(
				`DELETE FROM recipes
				WHERE
				recipe_id = $1`, [existing_recipe.id]);

			for (const x of lines) {
				await client.query(
					`INSERT INTO recipes(recipe_id, grocerie_id, amount)
					VALUES ($1, $2, $3)`, x);
			}

            client.release();
            return(result?.rows);
		} catch (err) {
			console.error(err);
			return("Error " + err);
		}		
	},

	// DELETE
	delete_recipe: async function(recipe) {
		let existing_recipe = (await this.get_recipe_by_name(recipe))[0];
		try {
			const client = await pool.connect();
			await client.query(
				`DELETE FROM recipes
				WHERE recipe_id = $1`, [existing_recipe.id]);

            const result = await client.query(
				`DELETE FROM recipes_names
				WHERE id = $1 RETURNING *
				`, [existing_recipe.id]);

            client.release();
            return(result?.rows);
		} catch (err) {
			console.error(err);
			return("Error " + err);
		}
	},

	// DIV
	setAmountInName(grocery_list) {
        grocery_list.forEach(x => {
            let item_number = x.standard_quantity > 0 ? x.amount/x.standard_quantity : 0;

            x.norwegian = item_number > 1 ? `${x.norwegian} x${Math.ceil(x.amount/x.standard_quantity)}` : x.norwegian;
        })
    }

	
}