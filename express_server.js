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
    keys: ['a', 'b'],
  })
);

const {users, urlDatabase, getUserByEmail, generateRandomString, urlsForUser} = require('./helpers');

app.get("/urls", (req, res) => {
  const templateVars = {urls: urlsForUser(req.session.userID, urlDatabase), user: users[req.session["userID"]]};
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  const longURL = req.body.longURL;
  const userID = req.session['userID'];
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {longURL, userID};
  res.redirect(`/urls/${shortURL}`);
})

//for adding new urls
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

//for editing and showing new urls
app.get("/urls/:shortURL", (req, res) => {
  const user = req.session["userID"];
  if (!user) {
    res.status(404).send("Please login or register an account");
  } else if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send("This URL does not exist");
  } else if (urlDatabase[req.params.shortURL].userID !== req.session["userID"]) {
    res.status(404).send("Please login as the appropriate user to view/edit this URL");
  } else if (urlDatabase[req.params.shortURL].userID === user) {
      const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.session["userID"]]
    };
    res.render("urls_show", templateVars);
  } 
  else {
    res.statusCode(404).send("Unknown error, please login or refresh this page");
  }
});

//editing process - POST
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

//deleting URLS
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

//Login - GET
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session["userID"]]
  };
  res.render("urls_login", templateVars);
});

//login verification process
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);
  if (user) {
    if (bcrypt.compareSync(req.body.password, user.password)) {
      req.session['userID'] = user.userID;
      res.redirect("/urls");
      } else {
      res.status(403).send('Incorrect password. Please re-enter the correct password.');
      }
    } else {
      res.status(403).send('Invalid email entered. Please enter in a valid email or register a new email.');
    }  
});

//when user logs out
app.post("/logout", (req, res) => {
  req.session['userID'] = null;
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  let templateVars = {user: users[req.session["userID"]]};
  res.render("urls_registration", templateVars);
});

//registration process
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (email && password) {
    if (!getUserByEmail(email, users)) {
      const userID = generateRandomString();
        users[userID] = {
          userID, 
          email,
          password: bcrypt.hashSync(req.body.password, 10)
        };
        req.session.userID = userID;
        res.redirect('/urls');
    }
    else {
      res.status(400).send('User is already registered, please login');
    }
  }
    else  if (email === '') {
    res.status(400).send('Email cannot be blank, please enter in a valid email.');
  } else if (password === '') {
    res.status(400).send('Password cannot be blank, please enter in a valid password.');
  } 
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
