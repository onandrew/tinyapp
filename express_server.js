const express = require("express");
const app = express();
const PORT = 8081; // default port 8080
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(
  cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
  })
);

//generate randomString for unique userID and urls
function generateRandomString() {
  let randomString = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let x = 0; x < 6; x++) {
    randomString += characters[Math.floor(Math.random() * characters.length)];
  }
  return randomString;
}

//database of users
const users = {};

//database for urls
const urlDatabase = {};

//function to add a new user after registration
const addNewUser = (email, password, database) => {
  const id = generateRandomString();
  database[id] = {
    id,
    email,
    password
  };
  return id;
};

//checking if a user is in our database
const checkIfUserExists = (email) => {
  for (let x in users) {
    if (users[x][email] === email) {
      return false;
    }
  }
  return true;
};

//retrieve userID through user email
const getUserByEmail = (email, database) => {
  for (let userID in database) {
    if (email === database[userID].email) {
      return database[userID];
    }
  }
  return undefined;
};

const urlsForUser = (id, database) => {
  const usersUrls = {};
  for (let x of Object.keys(database)) {
    if (database[x].userID === id) {
      usersUrls[x] = database[x];
    }
  }
  return usersUrls;
};

//default page
app.get("/", (req, res) => {
  res.send("Hello!");
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = {urls: urlsForUser(req.session.userID, urlDatabase), user: users[req.session["userID"]]};
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  const longURL = req.body.longURL;
  const userID = req.session.userID;
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {longURL, userID};
  res.redirect(`/urls/${shortURL}`);
})

app.get("/urls/new", (req, res) => {
  if (req.session.userID) {
    const templateVars = {user: users[req.session.userID]};
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.statusCode(404).send('This URL does not exist');
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (!req.session["userID"]) {
    res.status(404).send("Please login or register an account");
  } else if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send("This URL does not exist");
  } else if (urlDatabase[req.params.shortURL].userID === req.session["userID"]) {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.session["userID"]]
    };
    res.render("urls_show", templateVars);
  } else if (urlDatabase[req.params.shortURL].userID !== req.session["userID"]) {
    res.status(404).send("Please login as the appropriate user to view/edit this URL");
  } else {
    res.status(404).send("PleaseL login to use this page");
  }
});

app.post('/urls/:id', (req, res) => {
  if (urlDatabase[req.params.id].userID === req.session['userID']) {
  let longURL = req.body.longURL
  urlDatabase[req.params.id].longURL = longURL;
  res.redirect('/urls');
  }
  else {
    res.status(403).send("You are not authorized to edit this URL. Please login as the appropriate user");
    res.redirect('/urls/login');
  }
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req,res) => {
  const shortURL = req.params.shortURL;
  if (req.session.userID === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
  else {
    res.status(403).send("You are not authorized to delete this URL. Please login as the appropriate user");
  }
});

app.post("/urls/:shortURL/edit", (req, res) => {
  const key = req.params.shortURL;
  if (req.session.userID === urlDatabase[key].userID) {
  urlDatabase[key] = req.body.longURL;
  res.redirect('/urls')
  } else {
    res.status(403).send("You are not authorized to edit this URL. Please login as the appropriate user");
  }
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session["userID"]]
  };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);
  if (user) {
    if (bcrypt.compareSync(password, user.password)) {
      req.session['userID'] = user;
      res.redirect("/urls");
      } else {
        res.status(403).send('Incorrect password. Please re-enter the correct password.');
      }
      } else {
        res.status(403).send('Invalid email entered. Please enter in a valid email or register a new email.');
    }  
});

app.post("/logout", (req, res) => {
  req.session['userID'] = null;
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  let templateVars = {user: users[req.session["userID"]]};
  res.render("urls_registration", templateVars);
  res.redirect("/urls");
})

app.post("/register", (req, res) => {
  const newUserID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (email === '') {
    res.status(400).send('Email cannot be blank, please enter in a valid email.');
  } else if (hashedPassword === '') {
    res.status(400).send('Password cannot be blank, please enter in a valid password.');
  } else if (!checkIfUserExists(email)) {
    res.status(400).send('User already exists, please login.');
  } else {
    const userID = addNewUser(email, hashedPassword, users);
    req.session.userID = userID;
    res.redirect('/urls');
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
