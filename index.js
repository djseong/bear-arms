const express = require('express')
const app = express()
var path    = require("path")
const port = process.env.PORT || 5000; 


app.use(express.static(__dirname + '/'));
//Store all HTML files in view folder.

app.get('/',function(req,res){
  res.sendFile('index.html');
  //__dirname : It will resolve to your project folder.
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
