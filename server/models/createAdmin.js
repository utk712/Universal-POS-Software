const bcrypt = require("bcrypt");
const db = require("../config/db");

(async () => {
  const hash = await bcrypt.hash("admin123", 10);

  db.run(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    ["Admin", "admin@gmail.com", hash, "admin"],
    (err) => {
      if (err) console.log(err);
      else console.log("Admin Created ✅");
    }
  );
})();