const express = require("express");
const app = express();
const cors = require("cors");
const { connect } = require("mongoose");
const session = require("express-session");
require("dotenv").config();
const speakeasy = require("speakeasy");
const { Auth } = require("./model/AuthModel");
const jwt = require("jsonwebtoken");
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
    allowedHeaders: ["Content-Type", "Authorization"],
    origin: "*",
    methods: "PUT, POST, GET",
  })
);
// origin: ["http://192.168.0.169:4444", "https://2fa-surya.vercel.app"],
app.options("/:id", cors());

function createKey() {
  return speakeasy.generateSecret({ length: 20 }).base32;
}

function getTotp(key) {
  return speakeasy.totp({
    secret: key,
    encoding: "base32",
  });
}

function getHotp(key, counter) {
  return speakeasy.totp({
    secret: key,
    encoding: "base32",
    counter,
  });
}
function authenticateToken(req, res, next) {
  let headers = req.headers["authorization"];
  let token = headers && headers.split(" ")[1];
  console.log(headers);
  if (token == null) return res.json({ err: "token not found" });
  jwt.verify(token, process.env.JWT_TOKEN, (err, user) => {
    if (err) res.send("Token Invalid");
    req.user = user;
    next();
  });
}

app.post("/delete", async (req, res) => {
  let { id, selectedTotps, selectedHotps } = req.body;
  try {
    let auth = await Auth.findById(id);
    if (auth) {
      let totps = auth.totps.filter((_, ind) => !selectedTotps.includes(ind));
      let hotps = auth.hotps.filter((_, ind) => !selectedHotps.includes(ind));
      auth.totps = totps;
      auth.hotps = hotps;
      console.log("in delete");
      await auth.save();
      res.json({ mssg: "delted successfully" });
    } else res.json({ mssg: "in-delete: cant find user" });
  } catch (err) {
    res.json({ err });
  }
});

app.post("/sign-up", async (req, res) => {
  let { userId, password } = req.body;
  if (await Auth.findById(userId)) {
    return res.json({ err: "user Exists" });
  }
  let auth = new Auth({
    _id: userId,
    password,
  });
  console.log(req.body);
  await auth.save();
  return res.json({ mssg: "done" });
  // return res.json({ token: jwt.sign(user, process.env.JWT_TOKEN) });
});

app.post("/sign-in", async (req, res, next) => {
  let { userId, password } = req.body;
  let auth = await Auth.findOne({ _id: userId, password });

  if (auth) {
    console.log(auth);
    const totps = auth.totps.map((t) => {
      return {
        name: t.name,
        value: getTotp(t.key),
      };
    });
    const hotps = auth.hotps.map((t) => {
      return {
        name: t.name,
        counter: t.counter,
      };
    });
    return res.json({
      token: jwt.sign(userId, process.env.JWT_TOKEN),
      totps,
      hotps,
    });
  } else {
    return res.json({ err: "incorrect username or password" });
  }
});

app.post("/create-totp", async (req, res, next) => {
  let { id, name, key, autoGen } = req.body;
  console.log(">>: post-totp");
  try {
    let u = "";
    id ? (u = id) : authenticateToken(req, res, next) && (u = req.user);
    key = autoGen ? createKey() : key;
    console.log("user id: ", u);
    let auth = await Auth.findById(u);
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
    res.json({ mssg: "done", totp: { name, value: getTotp(key) } });
  } catch (err) {
    console.log(err);
    res.json({ err });
  }
});

app.post("/create-hotp", async (req, res) => {
  let { id, name, key, autoGen } = req.body;
  try {
    let auth = await Auth.findById(id);
    key = autoGen ? createKey() : key;
    if (auth) {
      auth.hotps.push({ name, key, counter: 0 });
      await auth.save();
    } else {
      let auth = new Auth({
        _id: id,
        hotps: [{ name, key, counter: 0 }],
      });
      await auth.save();
    }
    res.json({ mssg: "done", hotp: { name, counter: 0 } });
  } catch (err) {
    res.json({ err });
  }
});

app.post("/get-hotp", async (req, res) => {
  let { id, hotpIndex } = req.body;
  try {
    let auth = await Auth.findById(id);
    if (auth) {
      let hotp = auth.hotps[hotpIndex];
      let value = getHotp(hotp.key, hotp.counter);
      let counter = hotp.counter;
      auth.hotps[hotpIndex].counter += 1;
      await auth.save();
      res.json({ auth: { name: hotp.name, value, counter } });
    } else {
      res.json({ err: "not logined or invalid user id" });
    }
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
    const hotps = auth.hotps.map((t) => {
      return {
        name: t.name,
        counter: t.counter,
      };
    });
    return res.json({ totps, hotps });
  } else {
    res.json({ error: "cant find user with that id-" + id });
  }
});

app.get("/:id", async (req, res) => {
  const id = "2y34QpTv2DQeX4bJ01WRCqXOt973";
  let auth = await Auth.aggregate([]);
  res.json({ dev: "Jaya Surya" });
});

app.get("/", (req, res) => {
  res.json({ dev: "Jaya Surya" });
});

app.listen(process.env.PORT || 3000);
