const express = require('express');
const mongoose = require('mongoose');
const routes = require('./routes/api');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000; // environment variable for port

// Connect to the database
mongoose
    .connect(process.env.CONNECTION, { useNewUrlParser: true })
    .then(() => console.log(`Database connected successfully`))
    .catch((err) => console.log(err));




// // Since mongoose's Promise is deprecated, we override it with Node's Promise
mongoose.Promise = global.Promise;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

//responsible for parsing the incoming request bodies in a middleware before you handle it.
app.use(express.urlencoded({extended: true}));
app.use(express.json()) 

app.use('/api', routes);

app.use((req, res, next) => {
    res.send('Welcome to Express => node server');
});
  
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});