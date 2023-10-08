const express = require("express");
const app = express();
const PORT = 8081; // default port 8080
const cookie = require('cookie-parser');
const bodyParser = require('body-parser');
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cookie());

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

//database for urls
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userId: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userId: "user2RandomID" }
};

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
  for (let userId in database) {
    if (email === database[userId].email) {
      return database[userId];
    }
  }
  return undefined;
};

const urlsForUser(id) => {
  const usersUrls = {};
  for (let x in users) {
    if (id === users[x].userId) {
      usersUrls[x]= user[x];
    }
  }
  return usersUrls;
}

//default page
app.get("/", (req, res) => {
  res.send("Hello!");
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let user = users[req.cookies["userId"]];
  if (!user) {
    res.send("Please sign in or register");
    res.redirect("urls_login");
  }
  else {
  const templateVars = { 
    urls: urlsForUser(req.cookies.userId),
    user: users[req.cookies["userId"]]
  };
  res.render("urls_index", templateVars);
}
});

app.post('/urls', (req, res) => {
  if (!req.cookies['user_id']) {
    res.statusCode(403).send('You must be logged in to do that');
  }
  else {
  const shortURL = generateRandomString();
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
  }
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
  const longURL = urlDatabase[req.params.shortURL].longURL;
  if (longURL) {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    res.statusCode(404).send('This URL does not exist');
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: req.cookies["user_id"]
  };
  res.render("urls_show", templateVars);
});

app.post('/urls/:id', (req, res) => {
  if (urlDatabase[req.params.id].userID === req.cookies["userID"]) {
  let longURL = req.body.longURL
  urlDatabase[req.params.id] = longURL;
  res.redirect('/urls');
  }
  else {
    res.status(403).send("You are not authorized to edit this URL. Please login as the appropriate user");
    res.redirect('/urls/login');
  }
})

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req,res) => {
  const shortURL = req.params.shortURL;
  if (req.cookies['user_id'] === urlDatabase[shortURL].userId) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
  else {
    res.status(403).send("You are not authorized to delete this URL. Please login as the appropriate user");
  }
});

app.post("/urls/:shortURL/edit", (req, res) => {
  const key = req.params.shortURL;
  if (req.cookies['user_id'] === urlDatabase[key].userId) {
  urlDatabase[key] = req.body.longURL;
  res.redirect('/urls')
  } else {
    res.status(403).send("You are not authorized to edit this URL. Please login as the appropriate user");
  }
});

app.get("/login", (req, res) => {
  if (req.cookies.userId) {
    res.redirect('/urls');
    return;
  }

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
  if (req.cookies.userId) {
    res.redirect('/urls');
    return;
  }
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
