const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceKey.json");
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

// -------------------- Firebase Admin Initialization --------------------
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// -------------------- Middleware --------------------
app.use(cors());
app.use(express.json());

/**
 * verifyFBToken
 * Middleware to validate incoming Firebase ID tokens.
 */
const verifyFBToken = async (req, res, next) => {
  const authorization = req.headers.authorization;

  

  if (!authorization) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.token_email = decoded.email;
    next();
  } catch {
    return res.status(401).send({ message: "Unauthorized access" });
  }
};

// -------------------- MongoDB Connection --------------------
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9zbfeju.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// Root Route
app.get("/", (req, res) => {
  res.send("The Book Haven Server is running!");
});

// -------------------- Main Function --------------------
const run = async () => {
  try {
    // await client.connect();

    const db = client.db("books-db");
    const bookCollection = db.collection("books");
    const commentCollection = db.collection("comments");

    // ------------------------------------------------------
    // GET All Books (Filtered by email if provided)
    // ------------------------------------------------------
    app.get("/books", verifyFBToken, async (req, res) => {
      const email = req.query.email;
      const query = email ? { userEmail: email } : {};
      const result = await bookCollection
        .find(query)
        .sort({ created_at: 1 })
        .toArray();
      res.send(result);
    });

    // ------------------------------------------------------
    // GET Latest 6 Books
    // ------------------------------------------------------
    app.get("/latest-books", async (req, res) => {
      const email = req.query.email;
      const query = email ? { userEmail: email } : {};
      const result = await bookCollection
        .find(query)
        .sort({ created_at: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    // ------------------------------------------------------
    // GET Single Book by ID
    // ------------------------------------------------------
    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      const result = await bookCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // ------------------------------------------------------
    // POST Add a New Book
    // ------------------------------------------------------
    app.post("/books", verifyFBToken, async (req, res) => {
      const newBook = req.body;
      const result = await bookCollection.insertOne(newBook);
      res.send(result);
    });

    // ------------------------------------------------------
    // PUT Update a Book by ID
    // ------------------------------------------------------
    app.put("/book/:id", verifyFBToken, async (req, res) => {
      const id = req.params.id;
      const updatedBook = req.body;
      const result = await bookCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedBook }
      );
      res.send(result);
    });

    // ------------------------------------------------------
    // DELETE Remove a Book by ID
    // ------------------------------------------------------
    app.delete("/books/:id", verifyFBToken, async (req, res) => {
      const id = req.params.id;
      const result = await bookCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // ------------------------------------------------------
    // POST Add a Comment
    // ------------------------------------------------------
    app.post("/comments", verifyFBToken, async (req, res) => {
      const newComment = req.body;
      const result = await commentCollection.insertOne(newComment);
      res.send(result);
    });

    // ------------------------------------------------------
    // GET Comments By Book ID
    // ------------------------------------------------------
    app.get("/comments/:id", verifyFBToken, async (req, res) => {
      const bookId = req.params.id;
      const result = await commentCollection
        .find({ bookId })
        .toArray();
      res.send(result);
    });

    // MongoDB Ping Test
    // await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");
  } finally {}
};
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});