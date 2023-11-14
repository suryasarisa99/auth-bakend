const express = require("express");
const app = express();
const cors = require("cors");
const { connect } = require("mongoose");
const session = require("express-session");
require("dotenv").config();
const speakeasy = require("speakeasy");
const { Auth } = require("./model/AuthModel");
app.use(
  cors({
    allowedHeaders: "Content-Type",
    methods: "GET, POST, PUT, PATCH, DELETE",
    origin: "*",
  })
);

let db = "auth";

// * Data Base
const DB = `mongodb+srv://suryasarisa99:${process.env.DB_PASS}@cluster0.xtldukm.mongodb.net/${db}?retryWrites=true&w=majority`;
connect(DB).then((res) => {
  console.log("connected");
});

// app.set("set engine", "pug");
app.use(express.json());
app.use(express.static("./public"));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    methods: "PUT, POST, GET",
  })
);

function createKey() {
  return speakeasy.generateSecret({ length: 20 }).base32;
}

function getTotp(key) {
  return speakeasy.totp({
    secret: key,
    encoding: "base32",
  });
}

app.post("/create-auth", async (req, res) => {
  let { name, id } = req.body;
  let auth = await Auth.findById(id);
  let key = createKey();
  console.log(key);
  if (auth) {
    auth.totps.push({ name, key });
    await auth.save();
  } else {
    new Auth({
      _id: id,
      totps: [{ name, key }],
    });
  }
  res.json({ mssg: "done", auth: { name, value: getTotp(key) } });
});

app.post("/delete", async (req, res) => {
  let { id, selected } = req.body;
  try {
    let auth = await Auth.findById(id);
    if (auth) {
      let totps = auth.totps.filter((_, ind) => !selected.includes(ind));
      auth.totps = totps;
      console.log("in delete");
      await auth.save();
      res.json({ mssg: "delted successfully" });
    } else res.json({ mssg: "in-delete: cant find user" });
  } catch (err) {
    res.json({ err });
  }
});
app.post("/post-auth", async (req, res) => {
  let { id, name, key } = req.body;
  try {
    let auth = await Auth.findById(id);
    if (auth) {
      auth.totps.push({ name, key });
      await auth.save();
    } else {
      let auth = new Auth({
        _id: id,
        totps: [{ name, key }],
      });
      await auth.save();
    }
    res.json({ mssg: "done", auth: { name, value: getTotp(key) } });
  } catch (err) {
    res.json({ err });
  }
});

app.post("/", async (req, res) => {
  let { id } = req.body;
  let auth = await Auth.findById(id);
  // console.log(auth);
  if (auth) {
    const totps = auth.totps.map((t) => {
      return {
        name: t.name,
        value: getTotp(t.key),
      };
    });
    return res.json({ totps });
  } else {
    res.json({ error: "cant find user with that id-" + id });
  }
});

app.get("/", (req, res) => {
  res.json({ dev: "Jaya Surya" });
});

app.listen(process.env.PORT || 3000);
