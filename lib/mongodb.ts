import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

// Loaded once at module init — throws early if missing so the app never silently
// boots with a broken DB config.
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Environment variable "${key}" is not set.`);
  return value;
}

const MONGODB_URI = requireEnv("MONGODB_URI");
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? "cavista";

const cached: MongooseCache = (global.mongooseCache ??= {
  conn: null,
  promise: null,
});

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
      bufferCommands: false,
      autoIndex: true,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
