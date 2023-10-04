const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookie = require('cookie-parser');
const bodyParser = require('body-parser');
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cookie());
app.use(bodyParser.urlencoded({extended: false}));

function generateRandomString() {
  let randomString = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let x = 0; x < 6; x++) {
    randomString += characters[Math.floor(Math.random() * characters.length)];
  }
  return randomString;
}

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const addNewUser = (email, password) => {
  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password
  };
  return id;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user_id: req.cookies['user_id'] };
  res.render("urls_index", templateVars);
});
app.get("/urls/new", (req, res) => {
  const templateVars = { user_id: req.cookies['user_id']}
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: req.params.longURL, user_id: req.cookies['user_id']};
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  const generatedShortURL = generateRandomString();
  const longURL =  req.body.longURL;
  urlDatabase[generatedShortURL] = longURL;
  console.log(req.body); // Log the POST request body to the console
  res.redirect(`/urls/${generatedShortURL}`); //redirect to new URL
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req,res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL/edit", (req, res) => {
  const key = req.params.shortURL;
  urlDatabase[key] = req.body.longURL;
  res.redirect('/urls')
});

app.post("/login", (req, res) => {
  if (users[req.body.user_id]) {
    const user_id = req.body.user_id;
    res.cookie('user_id', user_id);
  }
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  let templateVars = {user_id: req.cookies['user_id']};
  res.render("urls_registration", templateVars);
  res.redirect("/urls");
})

app.post("/register", (req, res) => {
  const {email, password} = req.body;
  let user_id = addNewUser(email, password);
  res.cookie('user_id', user_id);
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
