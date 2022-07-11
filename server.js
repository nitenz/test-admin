const express = require('express');
const cors = require('cors')
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json({ type: '*/*' }));

const { Pool, Client } = require("pg");

const credentials = {
  user: 'postgres',
  host: 'host.docker.internal',
  database: 'store',
  password: 'postgrespw',
  port: 49153,
};

const pool = new Pool(credentials);
const client = new Client(credentials);

const createTables = () => {

  const query_products = `
  CREATE TABLE products (
      id BIGSERIAL,
      name varchar, 
      category varchar,
      price float,
      number int
  );
  `;

  const query_trades = `
  CREATE TABLE trades (
      id BIGSERIAL,
      seller int, 
      buyer int,
      type varchar,
      price float,
      status varchar
  );
  `;

  const query_users = `
  CREATE TABLE users (
      id BIGSERIAL,
      created_at TIMESTAMP DEFAULT NOW(),
      name varchar,
      username varchar,
      password varchar,
      email varchar,
      address varchar, 
      mobile_number int, 
      zip_code varchar, 
      vat_number int
  );
  `;

  const query_admin = `
  CREATE TABLE admin (
      id BIGSERIAL,
      user_id int,
      admin_type int
  );
  `;

  const tables= [query_users, query_products, query_trades, query_admin];

  //Establish connection to database
  client.connect()

  tables.forEach( query => {
    client.query(query, (err, res) => {
        if (err) {
          console.log(err.stack)
        } else {
          console.log(res.rows[0])
        }
    })
  }, () => {
    client.end()
    console.log('connection to datablse closed')
  })
}

//Itialize datatable, create tables if they don´t exist
(async () => {
  try{
    const text = `SELECT * FROM users`;
    const getTables = await pool.query(text);
  }catch(err){
    console.error(err)

    createTables(client); //Create tables
    console.log('Tables created!')
  }
})()


//ADMIN - Retrieve all users
async function getUsersFromAdmin(sort, order) {
  var text = `SELECT id, name, email, username, address, mobile_number, zip_code, vat_number FROM "users"`;
  const auxText = ` ORDER by `+sort+` `+order;
    
  text = sort&&order ? text + auxText : text;
  console.log('sort: ', sort);
  return pool.query(text);
}

//ADMIN - Retrieve all products
async function getProductsFromAdmin(sort, order) {
  var text = ` SELECT * FROM "products"`;
  const auxText = ` ORDER by `+sort+` `+order;
    
  text = sort&&order ? text + auxText  : text;
  console.log('sort: ', sort);
  return pool.query(text);
}

//ADMIN - Retrieve all trades
async function getTradesFromAdmin(sort, order) {
  var text = ` SELECT * FROM "trades"`;
  const auxText = ` ORDER by `+sort+` `+order;
    
  text = sort&&order ? text + auxText : text;
  console.log('sort: ', sort);
  return pool.query(text);
}

//create user
async function createUser(user) {
  const text = `
    INSERT INTO users (name, email, username, password, address, mobile_number, zip_code, vat_number)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
  `;
  
  const values = [user.name, user.email, user.username, user.password, user.address, user.mobile_number, user.zip_code, user.vat_number];
  return pool.query(text, values);
}

//retrive user info
async function getUser(field, value) {
  const text = `SELECT * FROM users WHERE ` + field + ` = $1`;
  const values = [value];
  return pool.query(text, values);
}

//change user info
async function updateUser(user) {
  const text = `UPDATE users SET name = $2, email = $3, username = $4, address = $5, mobile_number = $6, zip_code = $7, vat_number = $8 WHERE id = $1`;
  const values = [user.id, user.name, user.email, user.username, user.address, user.mobile_number, user.zip_code, user.vat_number];
  return pool.query(text, values);
}

//remove user
async function deleteUser(userId) {
  const text = `DELETE FROM users WHERE id = $1`;
  const values = [userId];
  return pool.query(text, values);
}

//create product
async function createProduct(product) {
  const text = `
    INSERT INTO products (name, category, price, number)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `;
  const values = [product.name, product.category, product.price, product.number];
  return pool.query(text, values);
}

//retrive product info
async function getProduct(field, value) {
  const text = `SELECT * FROM products WHERE ` + field + ` = $1`;
  const values = [value];
  return pool.query(text, values);
}

//change product info
async function updateProduct(product) {
  const text = `UPDATE products SET name = $2, category = $3, price = $4, number = $5 WHERE id = $1`;
  const values = [product.id, product.name, product.category, product.price, product.number];
  return pool.query(text, values);
}

//remove product
async function deleteProduct(productId) {
  const text = `DELETE FROM products WHERE id = $1`;
  const values = [productId];
  return pool.query(text, values);
}

//create trade
async function createTrade(trade) {
  const text = `
    INSERT INTO trades (seller, buyer, type, price)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `;
  const values = [trade.seller, trade.buyer, trade.type, trade.price];
  return pool.query(text, values);
}

//retrive trade info
async function getTrade(field, value) {
  const text = `SELECT * FROM trades WHERE ` + field + ` = $1`;
  const values = [value];
  return pool.query(text, values);
}

//change trade info
async function updateTrade(trade) {
  const text = `UPDATE trades SET seller = $2, buyer = $3, type = $4, price = $5 WHERE id = $1`;
  const values = [trade.id, trade.seller, trade.buyer, trade.type, trade.price];
  return pool.query(text, values);
}

//remove trade
async function deleteTrade(tradeId) {
  const text = `DELETE FROM trades WHERE id = $1`;
  const values = [tradeId];
  return pool.query(text, values);
}

//retrive admin info
async function getAdmin(userId) {
  const text = `SELECT * FROM admin WHERE id = $1`;
  const values = [userId];
  return pool.query(text, values);
}

//create new admin
async function addAdmin(userId, admin_type) {
  const text = `INSERT INTO admin (id, admin_type)
  VALUES ($1, $2)
  RETURNING id`;
  
  const values = [userId, admin_type];
  return pool.query(text, values);
}

app.use(cors());

//authentication
app.use('/auth', (req, res) => {
  (async () => {
    try{
      const { email, password} = req.body;
     
      const userData = await getUser('email',email);
      const userInfo = userData.rows[0];
      
      if(userInfo){
        if(userInfo.password === password){
          //validate if user exists in the admin´s table
          const validateIfHasAdmin = await getAdmin(userInfo.id);
      
          res.send({
            operation: 'auth',
            user: {
              id: userInfo.id,
              username: userInfo.username,
              email: userInfo.email,
              isAdmin:  validateIfHasAdmin.rowCount > 0 ? true : false
            },
            sucess: true
          });

        }else{
          res.send({
            operation: 'auth',
            sucess: false,
            message: 'Password invalid'
          });
        }
      
      }else{
        res.send({
          operation: 'auth',
          sucess: false,
          message: 'Email does not exist in the database!'
        });
      }

    }catch(err){
      console.error(err)

      res.send({
        operation: 'auth',
        sucess: false
      });
    }
  })()
});
 
//add admin privileges
app.use('/add_admin', (req, res) => {
  (async () => {
    try{
      const userId = 1;
      const userData = await getAdmin(userId);

      if(userData.rowCount === 0){
        const adminResp = await addAdmin(userId,1);

        res.send({
          operation: 'add_admin',
          user: adminResp.rows[0],
          sucess: true
        });
        console.log("Created new admin with id: " + userId);
      }
    }catch(err){
      console.error(err)

      res.send({
        operation: 'add_admin',
        sucess: false
      });
    }
  })()
});

//CRUD OPERATIONS FOR USERS/PRODUCTS/TRADES
app.use(['/:action/:id'], (req, res) => {
  const action = req.params.action.toLocaleLowerCase();
  const option = req.params.id;
  (async () => {
    try{
          
      if(req.method === 'GET'){
        //GET USERS, GET PRODUCTS, GET TRADES
        if(action==='users'){
          const userDb = await getUser('id',req.params.id);
          res.send(userDb.rows[0]);
        }else if(action==='products'){
          const userDb = await getProduct('id',req.params.id);
          res.send(userDb.rows[0]);
        }else{
          const userDb = await getTrade('id',req.params.id);
          res.send(userDb.rows[0]);
        }
      //DELETE USER, DELETE PRODUCT, DELETE TRADE
      }else if(req.method === 'DELETE'){
        if(action==='users'){
          const isAdmin = await getAdmin(req.params.id)

          if( isAdmin.rowCount === 0 ){
            const userDb = await deleteUser(req.params.id);
            res.send(userDb.rows[0]);
          }else{
            res.send({
              operation: req.method,
              target:action,
              sucess: false
            });
          }
         
        }else if(action==='products'){
          const userDb = await deleteProduct(req.params.id);
          res.send(userDb.rows[0]);
        }else{
          const userDb = await deleteTrade(req.params.id);
          res.send(userDb);
        }
      //UPDATE USER, UPDATE PRODUCT, UPDATE TRADE
      }else if(action==='PUT'){
        if(action==='users'){
          const userDb = await updateUser(req.body);
          res.send(userDb.rows[0]);
        }else if(action==='products'){
          const userDb = await updateProduct(req.body);
          res.send(userDb.rows[0]);
        }else{
          const userDb = await updateTrade(req.body);
          res.send(userDb.rows[0]);
        }
      }
      
    }catch(err){
      console.log(err)
      res.send({
        operation: req.method,
        action: action,
        sucess: false
      });
    }
  })()
});


//get users for admin section
app.use(['/:action/'], (req, res) => {
  let dataToReturn = {};

  (async () => {
    try{
      const action = req.params.action.toLowerCase();

      if(action !== 'add_user' && action !== 'add_trade' && action !== 'add_product'){
        console.log('action get lists: ', action)
        console.log('req: ', req.query)
  
        if(action === 'users'){
          const userData = await getUsersFromAdmin(req.query._sort, req.query._order);
          dataToReturn = userData.rows;
        }else if(action === 'products'){
          const productData = await getProductsFromAdmin(req.query._sort, req.query._order);
          dataToReturn = productData.rows;  
        }else{
          const tradesData = await getTradesFromAdmin(req.query._sort, req.query._order);
          dataToReturn = tradesData.rows;
        }
       
        res.append('X-Total-Count', dataToReturn.length);
        res.append('Access-Control-Expose-Headers', 'X-Total-Count');
  
        res.send(dataToReturn);
      }else if(action === 'add_user'){
        const newUser = req.body || {};
        let userDb = {};

        if(newUser){
          userDb = await getUser('email',newUser.email);
        }else{
          res.send({
            operation: 'add_user',
            sucess: false,
            message: 'No data'
          });
        }
        
        if(userDb && userDb.rowCount > 0){
          res.send({
            operation: 'add_user',
            sucess: false,
            message: 'Email already exists in the database'
          });
        }else{
          const newUserResp = await createUser(newUser);
          const userId = newUserResp.rows[0]["id"];
    
          res.send({
            operation: 'add_user',
            userId: userId,
            sucess: true
          });
          console.log("Registered a person with id: " + userId);
        }
      }else if(action === 'add_trade' || action === 'add_product'){
        let newTrade = {};
        let newProduct = {}
        let newItemId = 0;
        const item = req.body || {};
        console.log('item :', item )

        if(action === 'add_product'){ 
          newProduct = await createProduct(item);
          newItemId = newProduct.rows[0]["id"];
        }else{
          newTrade = await createTrade(item);
          newItemId = newTrade.rows[0]["id"];
        }
  
        res.send({
          operation: action,
          userId: newItemId,
          sucess: true
        });
        console.log("Registered a "+action+":  with id: " + newItemId);
      }
    }catch(err){
      console.error(err)

      res.send({
        operation: 'users',
        sucess: false
      });
    }
  })()
});

app.listen(8080, () => console.log('API is running on http://localhost:8080/'));