const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send({data: 'hello there'});
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 5000;
}
app.listen(port, console.log(`Listening on port ${port}`));
