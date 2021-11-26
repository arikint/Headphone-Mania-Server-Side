const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const cors = require('cors');
var admin = require("firebase-admin");
const ObjectId = require("mongodb").ObjectId;
const { json } = require('express');

const app = express();
const port = process.env.PORT || 5000;

var serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
 
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.knq90.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];
         
      try {
          const decodedUser = await admin.auth().verifyIdToken(token);
          
          req.decodedEmail = decodedUser.email;
      }
      catch {

      }
 
  }
  next();
}

async function run() {
    try {
        await client.connect(); 
        
        const database = client.db('headphonemania');
        const orders = database.collection('orders');
        const users = database.collection('users');
        const reviews = database.collection('reviews');
        const headphones = database.collection('headphones');
        const toprated = database.collection('toprated');
        
        

  
  // My Orders
  app.get("/myOrders/:email", async (req, res) => {
    const result = await orders.find({
      email: req.params.email,
    }).toArray();
    res.send(result);
  });
 

  // add Headphone
  app.post("/addHeadphone", async (req, res) => {
    console.log(req.body);
    const result = await headphones.insertOne(req.body);
    console.log(result);
  });
  
  // add Review
  app.post("/addReview", async (req, res) => {
    console.log(req.body);
    const result = await reviews.insertOne(req.body);
    console.log(result);
  });


  // get all Headphones

  app.get("/allHeadphones", async (req, res) => {
    const result = await headphones.find({}).toArray();
    res.send(result);
  });

  // get all Reviews

  app.get("/allReviews", async (req, res) => {
    const result = await reviews.find({}).toArray();
    res.send(result);
  });


   
  // get all Orders 

  app.get("/allOrders", async (req, res) => {
    console.log(req.body);
    const result = await orders.find({}).toArray();
    res.send(result);
  });

  // get Top rated brands 

  app.get("/topRated", async (req, res) => {
    console.log(req.body);
    const result = await toprated.find({}).toArray();
    res.send(result);
  });


  // Headphone item    

  app.get("/headphoneitem/:_id", async (req, res) => {
    const result = await headphones.find({
      _id: ObjectId(req.params._id),
    }).toArray();
    res.send(result);
  });

  
  // add Order     
  app.post("/addOrder", async (req, res) => {
    console.log(req.body);
    const result = await orders.insertOne(req.body);
    res.send(result);
    console.log(result);
  });



 
  // delete Order   

  app.delete("/deleteOrder/:id", async (req, res) => {
    console.log(req.params.id);
    const result = await orders.deleteOne({
      _id: ObjectId(req.params.id),
    });
    res.send(result);
  });
  
  // delete Headphone  

  app.delete("/deleteHeadphone/:id", async (req, res) => {
    console.log(req.params.id);
    const result = await headphones.deleteOne({
      _id: ObjectId(req.params.id),
    });
    res.send(result);
  });

  
  // Update Order Status to Shipped
  app.put("/shipOrder/:id", async (req, res) => {
      const qury={_id: ObjectId(req.params.id)};
      const update = {$set:req.body}
    console.log(qury);
    console.log(update);
    const result = await orders.updateOne(qury,update,{ upsert: true });
    res.send(result);
    console.log(result);
  });


  // Find users by email
  app.get('/users/:email', async (req, res) => {
    const email = req.params.email;
    const query = { email: email };
    const user = await users.findOne(query);
    let isAdmin = false;
    if (user?.role === 'admin') {
        isAdmin = true;
    }
    res.json({ admin: isAdmin });
})

  // Add users to database
app.post('/users', async (req, res) => {
    const user = req.body;
    const result = await users.insertOne(user);
    console.log(result);
    res.json(result);
});

  // Upserting user if not exist before
app.put('/users', async (req, res) => {
    const user = req.body;
    const filter = { email: user.email };
    const options = { upsert: true };
    const updateDoc = { $set: user };
    const result = await users.updateOne(filter, updateDoc, options);
    res.json(result);
});

  // Adding admin role to the user
app.put('/users/admin', async (req, res) => {
    const user = req.body;

            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await users.updateOne(filter, updateDoc);
            res.json(result);


})

    }
    finally {
        // await client.close();    
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Headphone Mania server is running');
});

app.listen(port, () => {
    console.log('Server running at port', port);
})