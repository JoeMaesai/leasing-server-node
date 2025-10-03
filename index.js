import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import A01CreatePackage from "./routes/A01CreatePackage.js";
import A02CreateUser from "./routes/A02CreateUser.js";
import A03CreateCustomer from "./routes/A03CreateCustomer.js";

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// In dev, allow your Vite origin. In prod, set your real domain.
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// DEMO users table (in real life use a DB)
const USERS = [
  // password is "secret123" hashed
  { id: 1, username: "joe", passwordHash: await bcrypt.hash("secret123", 10) },
];

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const COOKIE_NAME = "auth";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: false,         // true in production with HTTPS
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function setAuthCookie(res, payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
}

function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: "Unauthenticated" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};
  const user = USERS.find(u => u.username === String(username || "").toLowerCase());
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password || "", user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  setAuthCookie(res, { id: user.id, username: user.username });
  return res.json({ user: { id: user.id, username: user.username } });
});

app.post("/api/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTS, maxAge: 0 });
  res.json({ ok: true });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: { id: req.user.id, username: req.user.username } });
});

app.use("/A01CreatePackage", A01CreatePackage);
app.use("/A02CreateUser",A02CreateUser)
app.use("/A03CreateCustomer", A03CreateCustomer);

app.listen(3000, () => {
  console.log("Auth server running on http://localhost:3000");
});
