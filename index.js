import express from "express";
import bodyParser from "body-parser";
import pg from "pg";


const app= express();
const port=3000;

const db=new pg.Client({
user:"postgres",
host:"localhost",
database:"recipe",
password:"2023",
port:5432
});

db.connect();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("Public"));
app.use(bodyParser.json());

app.get("/",(req,res)=>{
    res.render("home.ejs");
});

app.post("/search",async(req,res)=>{
const input=req.body.search;
const result=await db.query(
   " SELECT id,title,ingredients,instructions FROM recipes WHERE LOWER(tags) LIKE '%'|| $1 ||'%';",
   [input.toLowerCase()]
);
const items = result.rows;
res.render("recipes.ejs",{
    listitems:items
});
});

app.post("/GetRecipes",async(req,res)=>{
    const name=req.body.getrecipe;
    const result=await db.query(
       " SELECT id,title,ingredients,instructions FROM recipes WHERE LOWER(tags) LIKE '%'|| $1 ||'%';",
       [name.toLowerCase()]
    );
    const items = result.rows;
    res.render("recipes.ejs",{
        listitems:items
    });
    });
app.post("/allRecipes",async(req,res)=>{
    const result=await db.query(
       " SELECT id,title,ingredients,instructions FROM recipes;",
    );
    const items = result.rows;
    res.render("recipes.ejs",{
        listitems:items
    });
    });

app.post("/view_Recipe",async(req,res)=>{
    const id= req.body.viewid;
   const result=await db.query("SELECT id,title,ingredients,instructions FROM recipes WHERE id=$1;",
    [id]
);
    const item=result.rows[0];
    console.log(result.rows[0]);

    const wishlistResult = await db.query("SELECT * FROM saved WHERE recipe_id = $1;", [id]);
    const cartResult= await db.query("SELECT * FROM cart WHERE recipe_id = $1;", [id]);
    const isLiked = wishlistResult.rowCount > 0; 
    const inCart = cartResult.rowCount > 0; 

    res.render("SingleRecipe.ejs",
        {
            recipes: { ...item, is_liked: isLiked, in_Cart: inCart}
        }
    );
});


app.post("/toggle_like", async (req, res) => {
    const { recipeId, isLiked } = req.body;

    if (isLiked) {
        await db.query("DELETE FROM saved WHERE recipe_id = $1;", [recipeId]);
    } else {
        await db.query("INSERT INTO saved (recipe_id) VALUES ($1);", [recipeId]);
    }
    res.sendStatus(200);
});

  
  app.post("/wishlist", async (req, res) => {
    const result = await db.query("SELECT * FROM saved INNER JOIN recipes ON saved.recipe_id = recipes.id;");
    const recipes = result.rows;
    res.render("Wishlist.ejs", { saved_recipes: recipes });
  });

  app.post("/addToCart", async (req, res) => {
    const { recipeId, inCart } = req.body;

    if (inCart) {
        await db.query("DELETE FROM cart WHERE recipe_id = $1;", [recipeId]);
    } else {
        await db.query("INSERT INTO cart (recipe_id) VALUES ($1);", [recipeId]);
    }
    res.sendStatus(200);
});
  

  app.post("/cart", async (req, res) => {
    const result = await db.query("SELECT * FROM cart INNER JOIN recipes ON cart.recipe_id = recipes.id;");
    const recipes = result.rows;
    res.render("Cart.ejs", { cart_recipes: recipes });
  });
  

app.listen(port,()=>{
    console.log(`Server running on port ${port}`);
});