const express = require("express");
const fs = require("fs")
const app = express();
const session = require("express-session");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
 // bodyparser=> JSON | urlencoded
// Définir le moteur de modèle
app.set("view engine", "pug");

// Spécifier le répertoire des vues
app.set("views", "./views");

// Cela permet à Express de servir les fichiers statiques (comme les fichiers CSS) à partir du dossier public
app.use(express.static("./public"));
//Cela permet de convertir les donnees lire a un objet json
const users = JSON.parse(fs.readFileSync("./db/users.json", "utf8"));
const articles = JSON.parse(fs.readFileSync("./db/articles.json", "utf8"));

function generateUniqueArticleId() {
  const existingIds = articles.map((i) => i.id);
  const largestId = existingIds.length > 0 ? Math.max(existingIds) : 0;
  const newId = largestId + 1;
  return newId;
}

app.get("/login", (req, res) => {
    res.render("Login");
});
// app.get("/welcome", (req, res) => {
//     res.render("welcome",{ username:  req.session.user.username});
// });
app.get("/register", (req, res) => {
    res.render("register");
});


app.use(
    session({
      secret: "secret",
      resave: false,
      saveUninitialized: true,
    })
  );
// fonction Register :

app.post("/registre", (req, res) => {
    //console.log(req.body)
    const Cusername = req.body.username;
    const CEmail = req.body.email;
    const Cpassword = req.body.passwd;
    const CRepassword = req.body.confirmPasswd;
  
    if (Cpassword !== CRepassword) {
      return res.render("register", { err: "passwords dont match" });
    }
   //  c'est-à-dire qu'il y'a un utilisateur avec le méme email :
    const exists = users.find((i) => i.email === CEmail);
  // si oui 
    if (exists) {
      return res.render("register", { err: "Username already exists" });
    }
  // Stocker les information de l'utilisateur dans un objet NewUser
    const newUser = {
      email: CEmail,
      password: Cpassword,
      username: Cusername,
    };
    // ajouter NewUser a objet users
    users.push(newUser);
    fs.writeFileSync("./db/users.json", JSON.stringify(users, null, 2), "utf8");
  
    console.log(users)
    res.render("Login");
  });

  app.post("/login", (req, res) => {
    const CEmail = req.body.email;
    const Cpassword = req.body.passwd;
    // chercher le user dans user.json
    const user = users.find(
      (i) => i.email === CEmail && i.password === Cpassword
    );
    // si le user existe :
    if (user) {
      // creer un session :
      req.session.user = user;
      
      res.cookie("email", CEmail);
      res.render("welcome", { username:  req.session.user.username , articles : articles});
    //   res.redirect("/welcome");
    }
    // si le user n'existe pas :
    else {
      res.render("Login", { err: "Invalid username or password" });
    }
  });
//////////// les routes de Article :

app.get("/AddArticle", (req, res) => {
  res.render("AddArticle");
});
app.post("/add-article",(req,res)=>{
        if (!req.session.user.username) {
          return res.redirect("/Login");
        }

        const article = req.body;
        if (!article) {
          return res.render("AddArticle", { error: "Please provide article data" });
        }

        const newArticle = {
          id: generateUniqueArticleId(),
          title:article.title,
          content: article.content,
          username: req.session.user.username,
        };

        articles.push(newArticle);
        fs.writeFileSync(
          "./db/articles.json",
          JSON.stringify(articles, null, 2),
          "utf8"
        );

        res.render("welcome", { username:  req.session.user.username , articles : articles});
})


app.get('/' , (req, res) => {
  if (req.session.user) {
    res.render("welcome", { username:  req.session.user.username , articles : articles});
  } else {
    res.render("welcome", { articles : articles});
  }
})

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.clearCookie("username");
  res.render("welcome", { articles : articles});
});


app.get('/edit/:id' , (req, res) => {
  const articleId = parseInt(req.params.id);
  const article = articles.find((i) => i.id === articleId);
  res.render("edit", { username:  req.session.user.username , article : article});
})

app.post('/update/:id', (req, res) => {
  const Ctitle = req.body.title;
  const Ccontent = req.body.content;

  const articleId = parseInt(req.params.id);
  const article = articles.find((i) => i.id === articleId);

  if(article){
    article.title = Ctitle;
    article.content = Ccontent;

    fs.writeFileSync(
      "./db/articles.json",
      JSON.stringify(articles, null, 2),
      "utf8"
    );

  }
  res.render("welcome", { username:  req.session.user.username , articles : articles});
})

app.post('/delete/:id',(req, res)=>{

  const articleId = parseInt(req.params.id);
  const articleIndex = articles.findIndex((i) => i.id === articleId);

  if (
    articleIndex !== -1 &&
    articles[articleIndex].username === req.session.user.username
  ) {
    articles.splice(articleIndex, 1);
    fs.writeFileSync(
      "./db/articles.json",
      JSON.stringify(articles, null, 2),
      "utf8"
    );
  }

  res.redirect("/");
  
});


app.listen(3000, () => {
  console.log("running!!!!!!!!!");
});