const { MongoClient } = require("mongodb");

// Replace the placeholder with your Atlas connection string
const uri = "mongodb://localhost:27017";
const databaseName = "task-manager";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri);

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    console.log('Connecting to MongoDB...');

    const db = client.db(databaseName);
    const tasks = client
        .db(databaseName)
        .collection("tasks");

    const users = client
        .db(databaseName)
        .collection("users");

    // users.deleteMany({
    //     description: 'Go for shopping'
    // });
    
    // const foundUsers = await users.find({}, { projection: { _id: 0 } }).toArray();
    // console.log(foundUsers);

    // await tasks.insertMany([
    //     {
    //         description: "Clean the room",
    //         completed: false
    //     },
    //     {
    //         description: "Do the dishes",
    //         completed: true
    //     },
    //     {
    //         description: "Take my shower",
    //         completed: false
    //     }
    // ]);

    const filter = { completed: false };
    const update = { $set: { completed: true } }
    tasks.updateMany(filter, update);

    tasks.deleteMany({
        description: 'Go for shopping'
    })

    const foundTasks = await tasks.find({}, { projection: { _id: 0 } }).toArray()
    console.log(foundTasks);

  } catch (error) {
    return console.log(`Error during operations: ${error}`);
  }
  finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run();