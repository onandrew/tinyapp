//database of users
const users = {};

//database for urls
const urlDatabase = {};

//retrieve userID through user email
const getUserByEmail = (email, database) => {
  for (let userID in database) {
    if (email === database[userID].email) {
      return database[userID];
    }
  }
  return undefined;
};

//generate randomString for unique userID and urls
const generateRandomString = function() {
  let randomString = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let x = 0; x < 6; x++) {
    randomString += characters[Math.floor(Math.random() * characters.length)];
  }
  return randomString;
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

module.exports = {getUserByEmail, generateRandomString, urlsForUser, users, urlDatabase};