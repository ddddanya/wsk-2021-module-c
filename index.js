const express = require("express");

// import routers
const router = require("./routes/concerts-v1");
const router2 = require("./routes/tickets-v1");

// express app init
const app = express();

// application/json parser
app.use(express.json());

// routes
app.use("/api/v1/concerts", router);
app.use("/api/v1/tickets", router2);

// listen at 8080
app.listen(8080);
