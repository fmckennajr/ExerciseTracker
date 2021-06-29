const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

mongoose.connect(process.env.MONGO_KEY, { useNewUrlParser: true, useUnifiedTopology: true });

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true },
  log: [{description: String, duration: Number, date: Date }],
  count: Number
},{versionKey:'count'});

const User = mongoose.model("User", userSchema);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// var fmckennajr = new User({username:"fmckennajr"});
// fmckennajr.save(function(err) {
//     if (err) return console.error(err);
//   });

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users/",  async (req,res) => {
  var username = String(req.body.username);
  if (!username) return res.send('UH OH');
  //console.log(username);
  var user = new User({username: username});
  await user.save(function(err,userObj) {
    if (err) return console.error(err);
    //console.log(userObj);
    res.json(userObj);
  });  
});

app.get("/api/users", (req,res) => {
  User.find({}, {_id:1, username:1}, function(err,user){
    if (err) return console.error(err);
    res.json(user);
  });
});

app.post("/api/users/:_id/exercises",  (req,res) => {
  var id = req.params._id;
  var {description, duration} = req.body;
  var reqDate = req.body.date
  
  User.findOne({_id : id}, function(err,user){
    if (err) return res.send(err.message)
    var date;

    reqDate ? date = new Date(reqDate).toDateString() : date = new Date().toDateString();
    //console.log(user._id);
    user.log.push({description, duration, date});
    user.save(function(err,userObj) {
      if (err) return console.error(err);
      //console.log(userObj);
      var uObj = {"_id": id, "username": userObj.username, "description":description, "duration":parseInt(duration),"date":date};
      //console.log(uObj);
     res.send(uObj);
    });  
    //console.log('done');
  });
});

app.get("/api/users/:_id/logs?", (req,res) => {
  var id = req.params._id;
    
  User.findOne({_id : id}, function(err,user){
    if (err) return res.send(err.message);
    var logArray = [];
    var testArray = user.log;
    if(req.query.from && req.query.to) {
      var from_date = new Date(req.query.from);
      var to_date = new Date(req.query.to);
      
      user.log.forEach(element => {
        var check_date = new Date(element.date);
        // console.log(element);
        if(check_date > from_date && check_date < to_date) { 
          logArray.push(element);
        }
      });
    } else if(req.query.limit) {
      // console.log("|testArray:%j|",testArray[0]);
      if(req.query.limit == 1){
       logArray.push(testArray[0]);
     } else {
       for(i=0;i<req.query.limit;i++){
         logArray.push(testArray[i]);
       }
        
     }
  
    }  else  {
      logArray = user.log;
    }

    // var date = new Date(user.date).toDateString();
    //console.log(user.log);
    // console.log("|logArray:%j|",logArray)
    var userObj = {"_id": id, "username": user.username, "count": user.count,"log": logArray};
    //console.log(userObj);
    res.send(userObj);
  });
});
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
