import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, "ledger.db"));

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    balance REAL DEFAULT 0,
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
    category TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    account_id INTEGER,
    note TEXT,
    goal_id INTEGER,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (goal_id) REFERENCES goals(id)
  );

  CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    personality TEXT,
    greeting TEXT,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER,
    role TEXT CHECK(role IN ('user', 'assistant')) NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (character_id) REFERENCES characters(id)
  );

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    icon TEXT,
    deadline DATETIME,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

  // Ensure goal_id exists in transactions table
  try {
    db.prepare("ALTER TABLE transactions ADD COLUMN goal_id INTEGER").run();
  } catch (e) {
    // Column already exists
  }

// Seed default character if none exists
const charCount = db.prepare("SELECT COUNT(*) as count FROM characters").get() as { count: number };
if (charCount.count === 0) {
  db.prepare(`
    INSERT INTO characters (name, description, personality, greeting, avatar)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    "Kuro",
    "一只超级可爱的卡通小黑猫，喜欢帮你数钱。",
    "活泼、软萌、偶尔会撒娇。是你的贴心财务管家。",
    "喵~ 我是你的卡通财务小助手！今天也要元气满满地记账哦！",
    "https://img.icons8.com/bubbles/200/cat.png"
  );
}

// Seed default account if none exists
const accCount = db.prepare("SELECT COUNT(*) as count FROM accounts").get() as { count: number };
if (accCount.count === 0) {
  db.prepare(`
    INSERT INTO accounts (name, balance, icon)
    VALUES (?, ?, ?)
  `).run("Cash", 0, "Wallet");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- API Routes ---

  // Accounts
  app.get("/api/accounts", (req, res) => {
    const accounts = db.prepare("SELECT * FROM accounts ORDER BY name ASC").all();
    res.json(accounts);
  });

  app.post("/api/accounts", (req, res) => {
    const { name, balance, icon } = req.body;
    const result = db.prepare("INSERT INTO accounts (name, balance, icon) VALUES (?, ?, ?)").run(name, balance || 0, icon);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/accounts/:id", (req, res) => {
    db.prepare("DELETE FROM accounts WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Transactions
  app.get("/api/transactions", (req, res) => {
    const transactions = db.prepare(`
      SELECT t.*, a.name as account_name, g.name as goal_name
      FROM transactions t 
      LEFT JOIN accounts a ON t.account_id = a.id 
      LEFT JOIN goals g ON t.goal_id = g.id
      ORDER BY timestamp DESC
    `).all();
    res.json(transactions);
  });

  app.post("/api/transactions", (req, res) => {
    const { amount, type, category, timestamp, account_id, note, goal_id } = req.body;
    
    const transaction = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO transactions (amount, type, category, timestamp, account_id, note, goal_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(amount, type, category, timestamp || new Date().toISOString(), account_id, note, goal_id);

      // Update account balance
      const adjustment = type === 'income' ? amount : -amount;
      db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(adjustment, account_id);
      
      // Update goal balance if linked
      if (goal_id) {
        // If expense, it's a contribution to the goal
        // If income, it's a withdrawal from the goal
        const goalAdjustment = type === 'expense' ? amount : -amount;
        db.prepare("UPDATE goals SET current_amount = current_amount + ? WHERE id = ?").run(goalAdjustment, goal_id);
        
        // Update status if completed
        const goal = db.prepare("SELECT * FROM goals WHERE id = ?").get(goal_id) as any;
        if (goal && goal.current_amount >= goal.target_amount) {
          db.prepare("UPDATE goals SET status = 'completed' WHERE id = ?").run(goal_id);
        } else if (goal && goal.current_amount < goal.target_amount) {
          db.prepare("UPDATE goals SET status = 'active' WHERE id = ?").run(goal_id);
        }
      }

      return result.lastInsertRowid;
    });

    const id = transaction();
    res.json({ id });
  });

  app.delete("/api/transactions/:id", (req, res) => {
    const t = db.prepare("SELECT * FROM transactions WHERE id = ?").get() as any;
    if (t) {
      const transaction = db.transaction(() => {
        const adjustment = t.type === 'income' ? -t.amount : t.amount;
        db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(adjustment, t.account_id);
        
        if (t.goal_id) {
          const goalAdjustment = t.type === 'expense' ? -t.amount : t.amount;
          db.prepare("UPDATE goals SET current_amount = current_amount + ? WHERE id = ?").run(goalAdjustment, t.goal_id);
          
          // Re-check status
          const goal = db.prepare("SELECT * FROM goals WHERE id = ?").get(t.goal_id) as any;
          if (goal && goal.current_amount < goal.target_amount) {
            db.prepare("UPDATE goals SET status = 'active' WHERE id = ?").run(t.goal_id);
          }
        }

        db.prepare("DELETE FROM transactions WHERE id = ?").run(req.params.id);
      });
      transaction();
    }
    res.json({ success: true });
  });

  // Characters
  app.get("/api/characters", (req, res) => {
    const characters = db.prepare("SELECT * FROM characters").all();
    res.json(characters);
  });

  app.post("/api/characters", (req, res) => {
    const { name, description, personality, greeting, avatar } = req.body;
    const result = db.prepare(`
      INSERT INTO characters (name, description, personality, greeting, avatar) 
      VALUES (?, ?, ?, ?, ?)
    `).run(name, description, personality, greeting, avatar);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/characters/:id", (req, res) => {
    const charId = req.params.id;
    const transaction = db.transaction(() => {
      db.prepare("DELETE FROM messages WHERE character_id = ?").run(charId);
      db.prepare("DELETE FROM characters WHERE id = ?").run(charId);
    });
    transaction();
    res.json({ success: true });
  });

  app.put("/api/characters/:id", (req, res) => {
    const { name, description, personality, greeting, avatar } = req.body;
    db.prepare(`
      UPDATE characters 
      SET name = ?, description = ?, personality = ?, greeting = ?, avatar = ?
      WHERE id = ?
    `).run(name, description, personality, greeting, avatar, req.params.id);
    res.json({ success: true });
  });

  // Settings
  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    const settingsMap = settings.reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.json(settingsMap);
  });

  app.post("/api/settings", (req, res) => {
    const { key, value } = req.body;
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
    res.json({ success: true });
  });

  app.post("/api/system/reset", (req, res) => {
    console.log('Received reset request');
    try {
      // Use a direct execution for reset to be more forceful
      db.transaction(() => {
        db.prepare("DELETE FROM messages").run();
        db.prepare("DELETE FROM transactions").run();
        db.prepare("DELETE FROM accounts").run();
        db.prepare("DELETE FROM characters").run();
        db.prepare("DELETE FROM settings").run();
        db.prepare("DELETE FROM goals").run();
        
        // Reset autoincrement sequences
        db.prepare("DELETE FROM sqlite_sequence").run();

        db.prepare(`
          INSERT INTO characters (id, name, description, personality, greeting, avatar)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          1,
          "Kuro",
          "一只超级可爱的卡通小黑猫，喜欢帮你数钱。",
          "活泼、软萌、偶尔会撒娇。是你的贴心财务管家。",
          "喵~ 我是你的卡通财务小助手！今天也要元气满满地记账哦！",
          "https://img.icons8.com/bubbles/200/cat.png"
        );

        db.prepare(`
          INSERT INTO accounts (id, name, balance, icon)
          VALUES (?, ?, ?, ?)
        `).run(1, "Cash", 0, "Wallet");
      })();
      
      res.json({ success: true });
    } catch (error) {
      console.error('CRITICAL: Reset failed:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Messages
  app.get("/api/messages/:characterId", (req, res) => {
    const messages = db.prepare("SELECT * FROM messages WHERE character_id = ? ORDER BY timestamp ASC").all(req.params.characterId);
    res.json(messages);
  });

  app.post("/api/messages", (req, res) => {
    const { character_id, role, content } = req.body;
    const result = db.prepare(`
      INSERT INTO messages (character_id, role, content) 
      VALUES (?, ?, ?)
    `).run(character_id, role, content);
    res.json({ id: result.lastInsertRowid });
  });

  // Goals
  app.get("/api/goals", (req, res) => {
    const goals = db.prepare("SELECT * FROM goals ORDER BY created_at DESC").all();
    res.json(goals);
  });

  app.post("/api/goals", (req, res) => {
    const { name, target_amount, current_amount, icon, deadline } = req.body;
    const result = db.prepare(`
      INSERT INTO goals (name, target_amount, current_amount, icon, deadline) 
      VALUES (?, ?, ?, ?, ?)
    `).run(name, target_amount, current_amount || 0, icon, deadline);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/goals/:id", (req, res) => {
    const { current_amount, status, name, target_amount, icon, deadline } = req.body;
    db.prepare(`
      UPDATE goals 
      SET current_amount = COALESCE(?, current_amount), 
          status = COALESCE(?, status),
          name = COALESCE(?, name),
          target_amount = COALESCE(?, target_amount),
          icon = COALESCE(?, icon),
          deadline = COALESCE(?, deadline)
      WHERE id = ?
    `).run(current_amount, status, name, target_amount, icon, deadline, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/goals/:id", (req, res) => {
    db.prepare("DELETE FROM goals WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Check-in status
  app.get("/api/checkin/:month", (req, res) => {
    const month = req.params.month; // Expected format: YYYY-MM
    const days = db.prepare(`
      SELECT DISTINCT strftime('%Y-%m-%d', timestamp) as date
      FROM transactions
      WHERE strftime('%Y-%m', timestamp) = ?
    `).all(month);
    res.json(days.map((d: any) => d.date));
  });

  // Financial Summary for AI
  app.get("/api/summary", (req, res) => {
    const totalBalance = db.prepare("SELECT SUM(balance) as total FROM accounts").get() as any;
    
    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7); // YYYY-MM
    
    const monthlyStats = db.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions
      WHERE strftime('%Y-%m', timestamp) = ?
    `).get(currentMonth) as any;

    const recentTransactions = db.prepare(`
      SELECT t.*, a.name as account_name 
      FROM transactions t 
      LEFT JOIN accounts a ON t.account_id = a.id 
      ORDER BY timestamp DESC 
      LIMIT 5
    `).all();

    const activeGoals = db.prepare("SELECT * FROM goals WHERE status = 'active'").all();

    res.json({
      totalBalance: totalBalance?.total || 0,
      monthlyStats: {
        month: currentMonth,
        income: monthlyStats?.income || 0,
        expense: monthlyStats?.expense || 0
      },
      recentTransactions,
      activeGoals
    });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
