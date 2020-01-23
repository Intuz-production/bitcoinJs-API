const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config({ "path" : __dirname + "/config/."+process.env.NODE_ENV.trim()+".env"});
// dotenv.config({ "path": __dirname + "/config/.staging.env" });
const cors = require("cors");
const bodyParser = require('body-parser');
var constants = require('./config/constants')
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const mongoose = require('mongoose');
const common = require('./common/common')

app.use(cors());

//Configure mongoose's promise to global promise
mongoose.promise = global.Promise;

//mongoose connection
mongoose.connect(`mongodb://${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`, {
  useNewUrlParser: true
}).catch(function (err) {
  console.log("DATABSE CONNECTION ERROR : ", err);
})
mongoose.connection.on("connected", function () {
  constants.consoleSeparate("MONGODB CONNECTED SUCCESSFULLY", "greenBright");
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/", require("./routes/index"));
app.use('/users', require('./routes/user'))

app.listen(process.env.PORT, () => {
  common.getAllUserWalletAddress()
  constants.consoleBox(`BITCOIN SERVICE IS RUNNING ON PORT ${process.env.PORT}`, "cyanBright");
})