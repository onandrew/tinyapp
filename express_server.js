const express = require("express");
const app = express();
const PORT = 8081; // default port 8080
const cookie = require('cookie-parser');
const bodyParser = require('body-parser');
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cookie());

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

const addNewUser = (email, password, database) => {
  const id = generateRandomString();
  database[id] = {
    id,
    email,
    password
  };
  return id;
};

const checkIfUserExists = (email) => {
  for (let x in users) {
    if (users[x][email] === email) {
      return false;
    }
  }
  return true;
};

const getUserByEmail = (email, database) => {
  for (let userId in database) {
    if (email === database[userId].email) {
      return database[userId];
    }
  }
  return undefined;
};


app.get("/", (req, res) => {
  res.send("Hello!");
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = {urls: urlDatabase, user: users[req.cookies["user_id"]]};
  res.render("urls_index", templateVars);
});

app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
})

app.get("/urls/new", (req, res) => {
  if (req.cookies['user_id']) {
  const templateVars = {user: users[req.cookies["user_id"]]};
  res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (longURL) {
    res.redirect(urlDatabase[req.params.shortURL]);
  } else {
    res.statusCode(404).send('This URL does not exist');
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: req.cookies["user_id"]
  };
  res.render("urls_show", templateVars);
});

app.post('/urls/:id', (req, res) => {
  let longURL = req.body.longURL
  urlDatabase[req.params.id] = longURL;
  res.redirect('/urls');
})

app.post("/urls/:shortURL", (req, res) => {
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

app.get("/login", (req, res) => {
  let templateVars = {user: null};
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
const email = req.body.email;
const password = req.body.password;
const user = getUserByEmail(email, users);
if (user) {
  if (password === user.password) {
    res.cookie("user_id", user.id);
    res.redirect("/urls");
    } else {
    res.status(403).send('Incorrect password. Please re-enter the correct password.');
    }
  } else {
    res.status(403).send('Invalid email entered. Please enter in a valid email or register a new email.');
  }  
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  let templateVars = {user: users[req.cookies["user_id"]]};
  res.render("urls_registration", templateVars);
  res.redirect("/urls");
})

app.post("/register", (req, res) => {
  const newUserID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  if (email === '') {
    res.status(400).send('Email cannot be blank, please enter in a valid email.');
  } else if (password === '') {
    res.status(400).send('Password cannot be blank, please enter in a valid password.');
  } else if (!checkIfUserExists(email)) {
    res.status(400).send('User already exists, please login.');
  } else {
    const user_id = addNewUser(email, password, users);
    req.cookies.user_id = user_id;
    res.redirect('/urls');
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
