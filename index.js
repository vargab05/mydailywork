require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require("path");

const app = express();
app.use(express.static('public'));
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'mysecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }, 
  store: MongoStore.create({
      mongoUrl: 'mongodb://localhost:27017/quiz', 
      collectionName: 'sessions'
  })
}));


mongoose.connect('mongodb://localhost:27017/quiz')
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));

const routes = require('./routes/routes');
app.use('/', routes);

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
