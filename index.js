const express = require('express');
const bodyparser = require('body-parser');
const mongoose = require('mongoose')

const app = express();
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

const port = process.env.PORT || 8000;
const dburl = 'mongodb://localhost:27017/TMO';

// Owner schema and model
const OwnerSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone_no: String,
  restaurant_name: String,
  tables: Number,
  password: String
});
const owner = mongoose.model('owner', OwnerSchema);

// Categories schema and model
const CategorySchema = new mongoose.Schema({
  owner_id: String,
  category_name: String
});
const categories = mongoose.model('category', CategorySchema);

// Dishes schema and model
const DishesSchema = new mongoose.Schema({
  category_id: String,
  dish_name: String,
  is_veg: Boolean
});
const dishes = mongoose.model('dishes', DishesSchema);

// Dish_price schema and model
const DishPriceSchema = new mongoose.Schema({
  dish_id:String,
  quantity_type: String,
  price: Number
});
const dish_price = mongoose.model('dish_price', DishPriceSchema);

// Orders schema and model
const OrdersSchema = new mongoose.Schema({
  owner_id: String,
  dish_id: String,
  quantity_id: String
});
const orders = mongoose.model('orders', OrdersSchema);

// Transactions schema and model
const TransactionsSchema = new mongoose.Schema({
  owner_id: String,
  total_price: Number,
  table_no: Number,
  date: String
});
const transactions = mongoose.model('transactions', TransactionsSchema);

//mongoDB connection
mongoose.connect(dburl)
.then(()=>{
  console.log("Connected To DataBase: TMO");
})
.catch(err => {
  console.log("Can't connect to database!");
  console.log(err);
})

//server succesfull message
app.get('/',(req, res) => {
    res.send(`server is running succesfully on port ${port}`);
});

app.listen(port, () => console.log(`server started on port ${port}`));