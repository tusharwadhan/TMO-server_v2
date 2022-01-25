const express = require('express');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

const port = process.env.PORT || 8000;
// const dburl = 'mongodb://localhost:27017/TMO';
const dburl = 'mongodb+srv://tushar:tushar52002@tmo-db.4c9nu.mongodb.net/TMO-DB?retryWrites=true&w=majority';

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
  owner_id: String,
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
  quantity_type: String,
  price: Number,
  table_no: Number
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
  // const del = await orders.deleteMany({__v:0});
  // const data = await dish_price.find({})
  // console.log(data);
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

  //encrypting password
  const hashedPassword = await bcrypt.hash(req.body.password,12)
  req.body.password = hashedPassword;

  //inserting data into db
  await owner.create(req.body,(error, docs)=> {
    if(error){
      obj.success = false;
      obj.message = "can't save user.. Please try again later!!";
      res.send(obj);
      return;
    }
    docs = JSON.parse(JSON.stringify(docs));
    delete docs.password;
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
    const result = await bcrypt.compare(req.body.password,data[0].password);
    if(!result){
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

  if(req.query.owner_id == undefined || req.query.owner_id == ""){
    obj.success = false;
    obj.message = "invalid ownerID";
    res.send(obj);
    return;
  }
  
  //getting items and price
  var dish = await dishes.find(req.query,{id:1,dish_name:1,category_id:1,owner_id:1,is_veg:1})
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

//Add orders
app.post('/order',async(req,res)=>{
  var obj = {"success":true, "message":"", "data":""}

  orders.insertMany(req.body,(error, docs)=>{
    if(error){
      obj.success = false;
      obj.message = "can't add order! please try again...";
      res.send(obj);
      return;
    }

    //sending response
    obj.message = "order added successfully!";
    res.send(obj);
  });
});

//Get orders
app.get('/order',async(req,res)=>{
  var obj = {"success":true, "message":"", "data":""}
  if(req.query.owner_id == undefined || req.query.owner_id == ""){
    obj.success = false;
    obj.message = "invalid ownerID";
    res.send(obj);
    return;
  }

  const order = await orders.find(req.query).lean();

  if(JSON.stringify(order) == "[]"){
    obj.success = false;
    obj.message = "This table have no orders";
    res.send(obj);
    return;
  }
  for(let i = 0 ; i < order.length ; i++){
    const dish = await dishes.find({_id:order[i].dish_id});
    let qp = {"type":order[i].quantity_type , "price":order[i].price};
    order[i].name = dish[0].dish_name;
    order[i].quantity_price = qp;
    delete order[i].dish_id;
    delete order[i].quantity_type;
    delete order[i].price;
  }
  obj.message = "order get successfully";
  obj.data = order;
  res.send(obj);
});

//delete order 
app.delete('/order',async (req, res) => {
  var obj = {"success":true, "message":"", "data":""}

  if(req.body.owner_id == undefined || req.body.owner_id == ""){
    obj.success = false;
    obj.message = "invalid ownerID";
    res.send(obj);
    return;
  }
  if(mongoose.Types.ObjectId.isValid(req.body.id)){
    const del = await orders.deleteMany({_id:req.body.id,owner_id:req.body.owner_id});
    if(del.deletedCount == 0){
      obj.success = false;
      obj.message = "no order with this id exist!";
      res.send(obj);
      return;
    }
    else{
      obj.message = "order deleted successfully";
      res.send(obj);
      return;
    }
  }
  obj.success = false;
  obj.message = "invalid id";
  res.send(obj);
});

//order finish
app.post('/orderFinish',async (req,res)=>{
  var obj = {"success":true, "message":"", "data":""}

  if(req.body.owner_id == undefined || req.body.owner_id == ""){
    obj.success = false;
    obj.message = "invalid ownerID";
    res.send(obj);
    return;
  }

  //getting price from table
  const price = await orders.find(req.body,{id:1,price:1});
  if(JSON.stringify(price)=="[]"){
    obj.success = false;
    obj.message = "no order exist on this table";
    res.send(obj);
    return;
  }

  //getting toal price
  var totalPrice = 0;
  for(var i = 0 ; i < price.length ; i++){
    totalPrice += price[i].price;
  }
  
  //getting current date
  var datetime = new Date();
  datetime = datetime.toISOString().slice(0,10);

  // inserting in transactions
  var insertobj = [{"owner_id":req.body.owner_id, "table_no":req.body.table_no, "total_price":totalPrice ,"date":datetime}];
  transactions.insertMany(insertobj,(error, docs)=>{
    if(error){
      obj.success = false;
      obj.message = "can't add transaction! please try again...";
      res.send(obj);
      return;
    }
  });

  //deleting order
  const del = await orders.deleteMany({table_no:req.body.table_no,owner_id:req.body.owner_id});
  // console.log(del);
  obj.message = "order finished successfully";
  res.send(obj);
});

//Get transactions
app.get('/transactions',async(req,res)=>{
  var obj = {"success":true, "message":"", "data":""}

  if(req.query.owner_id == undefined || req.query.owner_id == ""){
    obj.success = false;
    obj.message = "invalid OwnerID";
    res.send(obj);
    return;
  }

  const data = await transactions.find({owner_id:req.query.owner_id});
  obj.message = "transactions get successfully";
  obj.data = data;
  res.send(obj);
})

//wrong route
app.get('*',(req,res)=>{
  res.send("this route doesn't exist");
})

app.listen(port, () => console.log(`server started on port ${port}`));