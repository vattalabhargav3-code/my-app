import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const client = new MongoClient(uri);
      await client.connect();
      const db = client.db("riderx");
      
      const result = await db.collection("rides").insertOne(req.body);
      await client.close();
      
      return res.status(200).json({ success: true, id: result.insertedId });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ message: "Only POST allowed" });
  }
}
