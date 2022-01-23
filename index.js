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
app.get('/',async(req, res) => {
  // const del = await categories.deleteMany({__v:0});
  // res.send(del)
  res.send(`server is running succesfully on port ${port}`); 
});
//get owners
app.get('/owner',async(req,res)=>{
  
  const data = await owner.find({});
  res.send(data);
})

//register owner succesfull message
app.post('/register',async(req, res) => {
  var obj = {"success":true, "message":"", "data":""}

  if(req.body.name == "" ||
     req.body.phone_no == "" ||
     req.body.email == "" ||
     req.body.restaurant_name == "" ||
     req.body.tables == (null||undefined||"") ||
     req.body.password == ""){

      obj.success = false;
      obj.message = "please fill all fields";
      res.send(obj);
      return;
  }

  //inserting data into db
  await owner.create(req.body,(error, docs)=> {
    if(error){
      obj.success = false;
      obj.message = "can't save user.. Please try again later!!";
      res.send(obj);
      return;
    }
    
    console.log("user saved!");
    obj.message = `Registered successfully!`;
    obj.data = docs;
    res.send(obj);
  });
});

//login
app.post('/login',async(req,res)=>{
  var obj = {"success":true, "message":"", "data":""}
  
  var data = await owner.find({email:req.body.email});
    if(data[0] == undefined){
      obj.success = false;
      obj.message = "user does not exist";
      res.send(obj);
      return;
    }
    if(data[0].password != req.body.password){
      obj.success = false;
      obj.message = `password does not match for email : ${req.body.email}`;
      res.send(obj);
      return;
    }
    data = JSON.parse(JSON.stringify(data));
    delete data[0].password;
    obj.message = "Logged In successfully";
    obj.data = data[0];
    res.send(obj);

});

//Add Dish
app.post('/dish',async(req,res)=>{
  var obj = {"success":true, "message":"", "data":""}

  var data;

  //saving dishes
  function save_dish() {
    return new Promise((resolve, reject) => {
  
      dishes.insertMany(req.body,(error, docs)=>{
        if(error){
          obj.success = false;
          obj.message = "can't save item! please try again...";
          res.send(obj);
          resolve();
        }
        resolve(data = docs);
      });
  
    });
  }
  await save_dish();

  // making array of objects for quanity price
  let arrObj = [];
  let num = 0;
  for(let i = 0 ; i < req.body.length ; i++){
    for(let j = 0 ; j < req.body[i].quantity_price.length ; j++){
      req.body[i].quantity_price[j].dish_id = data[i].id;
      arrObj[num] = req.body[i].quantity_price[j];
      num++;
    }
  }

  // saving price of dishes
  dish_price.insertMany(arrObj,(error, docs)=>{
    if(error){
      obj.success = false;
      obj.message = "can't save quantity price! please try again...";
      res.send(obj);
      return;
    }

    //sending response
    obj.message = "all dishes has been saved successfully!";
    res.send(obj);
  });
  
});

//Get Dish
app.get('/dish',async(req,res)=>{
  var obj = {"success":true, "message":"", "data":""}
  
  //getting items and price
  var dish = await dishes.find(req.query,{id:1,dish_name:1,category_id:1,is_veg:1})
  var price = await dish_price.find({});
  var result = JSON.parse(JSON.stringify(dish));

  // adding price in dishes
  for(let i = 0 ; i < dish.length ; i++){
    let arr = [];
    let num = 0;
    for(let j = 0 ; j < price.length ; j++){
      if(dish[i].id == price[j].dish_id){
        arr[num] = price[j];
        num++;
      }
    }
    result[i].quantity_price = arr;
  }

  //sending response
  obj.message = "dishes get successfully";
  obj.data = result;
  res.send(obj);
})

//Add category
app.post('/category',(req,res)=>{
  var obj = {"success":true, "message":"", "data":""}

  categories.create(req.body,(error, docs)=>{
    if(error){
      obj.success = false;
      obj.message = "can't save category! please try again...";
      res.send(obj);
      return;
    }

    //sending response
    obj.message = "category saved successfully!";
    res.send(obj);
  });
});

//Get category
app.get('/category',async(req,res)=>{
  var obj = {"success":true, "message":"", "data":""}

  const category = await categories.find({})
  obj.message = "categories get successfully";
  obj.data = category;
  res.send(obj);
})



//wrong route
app.get('*',(req,res)=>{
  res.send("this route doesn't exist");
})

app.listen(port, () => console.log(`server started on port ${port}`));