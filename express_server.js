var bodyParser = require("body-parser");
var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;
var cookieParser = require("cookie-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

const users = {
  "j9eN2d": {
    id: "j9eN2d",
    email: "test@user.com",
    password: "123456"
  },
  "abc123": {
    id: "abc123",
    email: "test2@user.com",
    password: "123456"
  }
}
var urlDatabase = {
  "b2xVn2": {
    userid: "j9eN2d",
    longURL: "http://www.lighthouselabs.ca"
  },
  "9sm5xK": {
    userid: "abc123",
    longURL: "http://www.google.com"
  }
};
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['1q2w3e4r5t6y', 'qawsedrftgyh']
}));


app.use((req, res, next) => {
  req.user = users[req.session.userid];
  res.locals.user = req.user;

  next();
});
app.use("/urls", redirectMiddleware);

function redirectMiddleware(req, res, next){
  if (req.user == undefined){
    res.status(403);
    res.send('You shoud login in First or Register<br>Go to <a href="/login">login</a> in page<br>or go to <a href="/register">Register</a> page');


  } else {
    next();
  }
};


function urlsForUser(id) {
  var result = {};
  for(var shortURL in urlDatabase) {
    if( urlDatabase[shortURL].userid === id){
      result[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return result;
}

function generateRandomString() {
  let text = "";
  let charset = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUWXYZ";

  for (let i = 0; i < 6 ; i++) {
    text += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return text;
}

app.get("/urls", (req, res) => {
  let result = urlsForUser(res.locals.user.id);
  let templateVars = { urls: result };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render('urls_new');
});

app.post("/urls", (req, res) => {
  var shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userid: req.session.userid
  };
  res.redirect('/urls');
});

app.post("/urls/:id/delete", (req, res) => {
  if(!req.session.userid){
    res.redirect('/urls');
    return;
  }
  const id = req.params.id;
  if(!urlDatabase[req.params.id]) {
    res.redirect('/urls');
    return;
  }
  const ownerId = urlDatabase[req.params.id].userid;
  if(req.session.userid === ownerId){
    delete urlDatabase[req.params.id];
  }
  res.redirect('/urls');
});

app.get("/login", (req, res) => {
  let templateVars = { user: req.user }
  res.render("login", templateVars)
});

app.post("/login", (req, res) => {
      if(!req.body.email || !req.body.password) {
        res.status(403);
        res.send('Email and Password cannot be empty.');
        return;
      }
      for ( user in users){
        if (users[user].email === req.body.email && bcrypt.compareSync(req.body.password, users[user].password)) {
          req.session.userid = user;
          res.redirect("/urls");
          return;
        }
      }
      res.status(403).send('No match for Email or Password in the database.<br><a href="/login">return login</a>');
});

app.get("/urls/:id", (req, res) => {
    let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id].longURL,
   userid: req.session.userid };

  if ( urlDatabase[req.params.id].userid != req.user.id) {
    res.redirect("/urls");
  } else
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const shortID = req.params.id;
  const longURL = req.body.longURL;

  urlDatabase[shortID].longURL = longURL;
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(400);
    res.send('No existed URL');
  } else {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
}
});



app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/register", (req, res) => {
  let templateVars = {urls: urlDatabase}


  res.render("register", templateVars)
});

app.post("/register",(req, res) =>{
  var user_id = generateRandomString();
  const hashed_password = bcrypt.hashSync(req.body.password, 10);
  for (user in users) {
    if(users[user].email === req.body.email){
      res.status(403);
      res.send('Email or Password exists.');
    }

   if(!req.body.email || !req.body.password) {
    res.status(400);
    res.send('Email or Password can not be empty.');
    }

 }
    users[user_id] = {
    id: user_id,
    email: req.body.email,
    password: hashed_password
  }

  req.session.userid = user_id;
  res.redirect("/urls");
})

app.get("/debug", (req, res) => {
  res.json(users);
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});