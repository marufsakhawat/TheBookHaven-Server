const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

// ///////////// ************** mongodb set starts
const uri = "mongodb+srv://theBookHavenDBUser:xNFJZrmYuPvDn1iB@cluster0.piltxgj.mongodb.net/?appName=Cluster0";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// ///////////// ************** mongodb set end

app.get('/', (req, res) => {
  res.send('Hello to Book Haven Server!')
})

// ///////////// ************** mongodb 2 set starts
async function run () {
    try{
        await client.connect();

        const db = client.db('smart_db');
        const productsCollection = db.collection('products')

        app.post('/products', async(req, res) => {
            const newProduct = req.body;
            const result = await productsCollection.insertOne(newProduct);
            res.send(result)
        })

        app.delete('/products/:id', async(req, res) => {
          const id = req.params.id;
          const query = { _id: new ObjectId(id  )}
          const result = await productsCollection.deleteOne(query);
          res.send(result);
        })

        await client.db("admin").command({ping: 1})
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    finally{
        // await client.close();
    }
}

run().catch(console.dir)
// ///////////// ************** mongodb 2 set end









app.listen(port, () => {
  console.log(`Book Haven Server listening on port ${port}`)
})