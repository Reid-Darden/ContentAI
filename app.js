// requires
const express = require("express");
const routes = require("./backend/routes");

const app = express();

app.use(express.json());

// SITE SETUP
app.use("/frontend", express.static("frontend"));
app.use("/files", express.static("files"));
app.use("/", routes);

app.listen(3000, () => {
  console.log("Server started on port 3000.");
});
