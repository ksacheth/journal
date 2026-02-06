import {
  MongoClient,
  ServerApiVersion,
  type MongoClientOptions,
} from "mongodb";

const uri = process.env.MONGODB_URL || "";

const options: MongoClientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

// Only create connection if URI is provided (skip during build time)
if (uri) {
  if (process.env.NODE_ENV === "development") {
    // In development, use a global variable to preserve the client across hot reloads
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production, create a new client
    const client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
} else {
  // During build time, provide a dummy promise that will never resolve
  // This prevents the build from failing
  clientPromise = new Promise(() => {});
}

export default clientPromise;
