const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "health360-secret-key"; // Use a secure secret in production
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// MySQL connection configuration
const dbConfig = {
  host: "srv531.hstgr.io",
  user: "u109550565_health360", // Replace with your Hostinger MySQL user
  password: "Kiosk@2025", // Replace with your Hostinger MySQL password
  database: "u109550565_health360",
};

// Create MySQL connection pool
const pool = mysql.createPool(dbConfig);

// OTP storage (in-memory, as before)
const otpStorage = {};
const dataStorage = {};

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "health.kiosk2025@gmail.com",
    pass: "hovfnqtovqqfmexm", // Use environment variables in production
  },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function cleanupExpiredOtps() {
  const now = Date.now();
  for (const email in otpStorage) {
    if (otpStorage[email].expiresAt < now) {
      delete otpStorage[email];
      delete dataStorage[email];
    }
  }
}

// Middleware to authenticate admin
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

// SEND OTP
app.post("/send-otp", async (req, res) => {
  const { email, data, type } = req.body;
  if (!email || !type || !data) {
    return res.status(400).json({ message: "Email, type, and data are required" });
  }

  cleanupExpiredOtps();

  try {
    const connection = await pool.getConnection();
    try {
      if (type === "admin" || type === "superadmin") {
        if (data.admin_id) {
          // Admin creation flow
          const [idRows] = await connection.query(
            "SELECT admin_id FROM admins WHERE admin_id = ?",
            [data.admin_id]
          );
          if (idRows.length > 0) {
            return res.status(400).json({ message: "Admin ID already exists" });
          }

          const [aadhaarRows] = await connection.query(
            "SELECT aadhaar_no FROM admins WHERE aadhaar_no = ?",
            [data.aadhaar_no]
          );
          if (aadhaarRows.length > 0) {
            return res.status(400).json({ message: "Aadhaar already exists for another admin" });
          }

          const [emailRows] = await connection.query(
            "SELECT email FROM admins WHERE email = ?",
            [email]
          );
          if (emailRows.length > 0) {
            return res.status(400).json({ message: "Email already exists for another admin" });
          }
        } else {
          // Forgot password flow
          const table = type === "superadmin" ? "superadmin" : "admins";
          const idField = type === "superadmin" ? "super_admin" : "admin_id";
          const [rows] = await connection.query(
            `SELECT ${idField} FROM ${table} WHERE aadhaar_no = ? AND email = ? LIMIT 1`,
            [data.aadhaar_no, email]
          );
          if (rows.length === 0) {
            return res.status(400).json({
              message: "No user found with matching Aadhaar and Email",
            });
          }
        }
      }

      if (type === "panchayat") {
        const [idRows] = await connection.query(
          "SELECT panchayat_id FROM panchayats WHERE panchayat_id = ?",
          [data.panchayat_id]
        );
        if (idRows.length > 0) {
          return res.status(400).json({ message: "Panchayat ID already exists" });
        }

        const [nameRows] = await connection.query(
          "SELECT panchayat_name FROM panchayats WHERE panchayat_name = ?",
          [data.panchayat_name]
        );
        if (nameRows.length > 0) {
          return res.status(400).json({ message: "Panchayat name already exists" });
        }
      }

      const otp = generateOTP();
      otpStorage[email] = { otp, expiresAt: Date.now() + 120000 };
      dataStorage[email] = { data, type };

      const mailOptions = {
        from: "health.kiosk2025@gmail.com",
        to: email,
        subject: `Your OTP for ${type} Verification`,
        text: `Your OTP for ${type} verification is: ${otp}. This OTP is valid for 2 minutes.`,
      };

      await transporter.sendMail(mailOptions);
      res.json({ message: "OTP sent successfully" });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ message: "Server error during validation" });
  }
});

// VERIFY OTP & SAVE DATA
app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const storedOtpData = otpStorage[email];
  if (!storedOtpData) {
    return res.status(400).json({ message: "OTP not found or expired" });
  }

  if (Date.now() > storedOtpData.expiresAt) {
    delete otpStorage[email];
    delete dataStorage[email];
    return res.status(400).json({ message: "OTP has expired" });
  }

  if (storedOtpData.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  const { data, type } = dataStorage[email];
  delete otpStorage[email];
  delete dataStorage[email];

  try {
    const connection = await pool.getConnection();
    try {
      if (type === "mother") {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        await connection.query(
          `INSERT INTO mothers (
            mother_id, name, age, email, phone, dob, hus_name, bank_name, account_no, 
            ifsc_code, aadhaar_no, mobile, admin_id, created_date, created_at, updated_at, lmp_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            data.mother_id,
            data.name,
            data.age,
            data.email,
            data.phone,
            data.dob,
            data.hus_name,
            data.bank_name,
            data.account_no,
            data.ifsc_code,
            data.aadhaar_no,
            data.mobile,
            data.admin_id,
            data.created_date,
            new Date().toISOString(),
            new Date().toISOString(),
            data.lmp_date,
          ]
        );
        return res.json({ message: "Mother record saved" });
      }
      return res.status(400).json({ message: "Invalid type for save" });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error saving verified data:", err);
    return res.status(500).json({ message: "Failed to save data" });
  }
});

// VERIFY OTP FOR RESET
app.post("/verify-otp-for-reset", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const storedOtpData = otpStorage[email];
  if (!storedOtpData) {
    return res.status(400).json({ message: "OTP not found or expired" });
  }

  if (Date.now() > storedOtpData.expiresAt) {
    delete otpStorage[email];
    delete dataStorage[email];
    return res.status(400).json({ message: "OTP has expired" });
  }

  if (storedOtpData.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  delete otpStorage[email];
  return res.json({ message: "OTP verified" });
});

// ADMIN LOGIN
app.post("/check-admin", async (req, res) => {
  const { aadhaar, password } = req.body;

  if (!aadhaar || !password) {
    return res.status(400).json({ message: "Aadhaar and password required" });
  }

  try {
    const connection = await pool.getConnection();
    try {
      // Superadmin login
      const [superRows] = await connection.query(
        "SELECT super_admin, aadhaar_no, password, role FROM superadmin WHERE aadhaar_no = ? LIMIT 1",
        [aadhaar]
      );

      if (superRows.length > 0) {
        const superadmin = superRows[0];
        const match = await bcrypt.compare(password, superadmin.password);
        if (!match) {
          return res.status(400).json({ message: "Invalid Aadhaar or password" });
        }

        const token = jwt.sign(
          {
            aadhaar: superadmin.aadhaar_no,
            role: "superadmin",
            admin_id: superadmin.super_admin,
          },
          JWT_SECRET,
          { expiresIn: "2h" }
        );

        return res.json({
          message: "Login successful",
          role: "superadmin",
          aadhaar: superadmin.aadhaar_no,
          admin_id: superadmin.super_admin,
          token,
        });
      }

      // Admin login
      const [adminRows] = await connection.query(
        "SELECT admin_id, aadhaar_no, password, role FROM admins WHERE aadhaar_no = ? LIMIT 1",
        [aadhaar]
      );

      if (adminRows.length > 0) {
        const adminData = adminRows[0];
        const match = await bcrypt.compare(password, adminData.password);
        if (!match) {
          return res.status(400).json({ message: "Invalid Aadhaar or password" });
        }

        const token = jwt.sign(
          {
            aadhaar: adminData.aadhaar_no,
            role: adminData.role || "admin",
            admin_id: adminData.admin_id,
          },
          JWT_SECRET,
          { expiresIn: "2h" }
        );

        return res.json({
          message: "Login successful",
          role: adminData.role || "admin",
          aadhaar: adminData.aadhaar_no,
          admin_id: adminData.admin_id,
          token,
        });
      }

      return res.status(400).json({ message: "Invalid Aadhaar or password" });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Login check failed:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET NEXT ID
app.get("/get-latest-id", async (req, res) => {
  try {
    const { collection, prefix } = req.query;
    if (!collection || !prefix) {
      return res.status(400).json({ message: "Missing query parameters" });
    }

    const connection = await pool.getConnection();
    try {
      let idField;
      if (collection === "admins") idField = "admin_id";
      else if (collection === "panchayats") idField = "panchayat_id";
      else if (collection === "mothers") idField = "mother_id";
      else if (collection === "children") idField = "child_id";
      else {
        return res.status(400).json({ message: "Invalid collection" });
      }

      const [rows] = await connection.query(
        `SELECT ${idField} FROM ${collection} WHERE ${idField} LIKE ?`,
        [`${prefix}%`]
      );

      let maxNumber = 0;
      rows.forEach((row) => {
        const num = parseInt(row[idField].slice(prefix.length));
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      });

      const nextId = prefix + String(maxNumber + 1).padStart(3, "0");
      res.json({ nextId });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error in get-latest-id:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ADD ADMIN
app.post("/add-admin", async (req, res) => {
  try {
    const { admin_id, aadhaar_no, password, name, email, contact, panchayat_id } = req.body;

    if (!admin_id || !aadhaar_no || !password || !name || !email || !contact || !panchayat_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const connection = await pool.getConnection();
    try {
      const [existingRows] = await connection.query(
        "SELECT admin_id FROM admins WHERE admin_id = ?",
        [admin_id]
      );
      if (existingRows.length > 0) {
        return res.status(400).json({ message: "Admin ID already exists" });
      }

      const [aadhaarRows] = await connection.query(
        "SELECT aadhaar_no FROM admins WHERE aadhaar_no = ?",
        [aadhaar_no]
      );
      if (aadhaarRows.length > 0) {
        return res.status(400).json({ message: "Admin with this Aadhaar already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const now = new Date().toISOString();

      await connection.query(
        `INSERT INTO admins (
          admin_id, name, aadhaar_no, email, contact, password, panchayat_id, role, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          admin_id,
          name,
          aadhaar_no,
          email,
          contact,
          hashedPassword,
          panchayat_id,
          "admin",
          now,
          now,
        ]
      );

      res.json({ message: "Admin added successfully" });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error in /add-admin:", error);
    res.status(500).json({ message: "Server error while adding admin" });
  }
});

// GET MOTHER BY ID
app.get("/get-mother", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ message: "Mother ID is required" });

  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT * FROM mothers WHERE mother_id = ?",
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: "Mother not found" });
      }

      const data = rows[0];
      delete data.password; // Hide sensitive info
      res.json(data);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching mother:", error);
    res.status(500).json({ message: "Error fetching mother data" });
  }
});

// UPDATE CHILD
app.post("/update-child", async (req, res) => {
  const { child_id, name, aadhaar_no, dob, age, mother_id, admin_id, email } = req.body;

  if (!child_id) {
    return res.status(400).json({ message: "Child ID is required" });
  }

  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT child_id FROM children WHERE child_id = ?",
        [child_id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: "Child not found" });
      }

      const updateData = {
        name,
        aadhaar_no,
        age,
        mother_id,
        admin_id,
        email,
        updated_at: new Date().toISOString(),
      };
      if (dob) {
        const parsedDob = new Date(dob);
        const formattedDob = `${parsedDob.getDate().toString().padStart(2, "0")}/${(parsedDob.getMonth() + 1).toString().padStart(2, "0")}/${parsedDob.getFullYear()}`;
        updateData.dob = formattedDob;
      }

      await connection.query(
        `UPDATE children SET
          name = ?, aadhaar_no = ?, age = ?, mother_id = ?, admin_id = ?, email = ?, updated_at = ?
          ${dob ? ", dob = ?" : ""}
        WHERE child_id = ?`,
        dob
          ? [name, aadhaar_no, age, mother_id, admin_id, email, updateData.updated_at, updateData.dob, child_id]
          : [name, aadhaar_no, age, mother_id, admin_id, email, updateData.updated_at, child_id]
      );

      res.json({ message: "Child details updated successfully" });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error updating child:", err);
    res.status(500).json({ message: "Server error while updating child" });
  }
});

// UPDATE MOTHER
app.post("/update-mother", async (req, res) => {
  const {
    mother_id, name, aadhaar_no, hus_name, dob, age, phone, email,
    account_no, ifsc_code, bank_name, admin_id, lmp_date, delivery_expected,
  } = req.body;

  if (!mother_id) {
    return res.status(400).json({ message: "Mother ID is required" });
  }

  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT mother_id FROM mothers WHERE mother_id = ?",
        [mother_id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: "Mother not found" });
      }

      const updateData = {
        name, aadhaar_no, hus_name, dob, age, phone, email,
        account_no, ifsc_code, bank_name, admin_id, lmp_date,
        updated_at: new Date().toISOString(),
      };
      if (delivery_expected) updateData.delivery_expected = delivery_expected;

      await connection.query(
        `UPDATE mothers SET
          name = ?, aadhaar_no = ?, hus_name = ?, dob = ?, age = ?, phone = ?,
          email = ?, account_no = ?, ifsc_code = ?, bank_name = ?, admin_id = ?,
          lmp_date = ?, updated_at = ?
          ${delivery_expected ? ", delivery_expected = ?" : ""}
        WHERE mother_id = ?`,
        delivery_expected
          ? [
              name, aadhaar_no, hus_name, dob, age, phone, email,
              account_no, ifsc_code, bank_name, admin_id, lmp_date,
              updateData.updated_at, delivery_expected, mother_id,
            ]
          : [
              name, aadhaar_no, hus_name, dob, age, phone, email,
              account_no, ifsc_code, bank_name, admin_id, lmp_date,
              updateData.updated_at, mother_id,
            ]
      );

      res.json({ message: "Mother details updated successfully" });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error updating mother:", err);
    res.status(500).json({ message: "Server error while updating mother" });
  }
});

// ADD/UPDATE PANCHAYAT
app.post("/add-panchayat", async (req, res) => {
  const { panchayat_id, panchayat_name, location, admin_id } = req.body;

  if (!panchayat_id || !panchayat_name || !location || !admin_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const connection = await pool.getConnection();
    try {
      const [existingRows] = await connection.query(
        "SELECT panchayat_id FROM panchayats WHERE panchayat_id = ?",
        [panchayat_id]
      );
      const isEditing = existingRows.length > 0;

      if (!isEditing) {
        const [nameRows] = await connection.query(
          "SELECT panchayat_name FROM panchayats WHERE panchayat_name = ?",
          [panchayat_name]
        );
        if (nameRows.length > 0) {
          return res.status(400).json({ message: "Panchayat name already exists" });
        }
      }

      const now = new Date().toISOString();
      if (isEditing) {
        await connection.query(
          "UPDATE panchayats SET panchayat_name = ?, location = ?, admin_id = ?, updated_at = ? WHERE panchayat_id = ?",
          [panchayat_name, location, admin_id, now, panchayat_id]
        );
      } else {
        await connection.query(
          "INSERT INTO panchayats (panchayat_id, panchayat_name, location, admin_id, updated_at) VALUES (?, ?, ?, ?, ?)",
          [panchayat_id, panchayat_name, location, admin_id, now]
        );
      }

      res.json({
        message: isEditing ? "Panchayat updated successfully" : "Panchayat added successfully",
      });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error saving panchayat:", err);
    res.status(500).json({ message: "Server error while saving panchayat" });
  }
});

// GET PANCHAYATS
app.get("/get-panchayats", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query("SELECT * FROM panchayats");
      const panchayats = rows.map((row) => ({
        panchayat_id: row.panchayat_id,
        panchayat_name: row.panchayat_name,
        location: row.location,
        admin_id: row.admin_id,
        updated_at: row.updated_at,
      }));
      res.json(panchayats);
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error getting panchayats:", err);
    res.status(500).json({ message: "Failed to fetch panchayats" });
  }
});

// GET ADMIN BY ID
app.get("/get-admin", async (req, res) => {
  const { admin_id } = req.query;
  if (!admin_id) {
    return res.status(400).json({ message: "Admin ID is required" });
  }

  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT * FROM admins WHERE admin_id = ?",
        [admin_id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: "Admin not found" });
      }

      const data = rows[0];
      delete data.password;
      res.json(data);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching admin:", error);
    res.status(500).json({ message: "Error fetching admin data" });
  }
});

// UPDATE ADMIN
app.post("/update-admin", async (req, res) => {
  const { admin_id, aadhaar_no, name, email, contact, password, panchayat_id } = req.body;

  if (!admin_id) {
    return res.status(400).json({ message: "Admin ID is required" });
  }

  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT admin_id FROM admins WHERE admin_id = ?",
        [admin_id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: "Admin not found" });
      }

      const updateData = {
        aadhaar_no,
        name,
        email,
        contact,
        panchayat_id,
        updated_at: new Date().toISOString(),
      };

      let query = `UPDATE admins SET
        aadhaar_no = ?, name = ?, email = ?, contact = ?, panchayat_id = ?, updated_at = ?`;
      const params = [
        aadhaar_no, name, email, contact, panchayat_id, updateData.updated_at,
      ];

      if (password && password.trim() !== "") {
        const hashedPassword = await bcrypt.hash(password, 10);
        query += ", password = ?";
        params.push(hashedPassword);
      }

      query += " WHERE admin_id = ?";
      params.push(admin_id);

      await connection.query(query, params);
      res.json({ message: "Admin updated successfully" });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error updating admin:", error);
    res.status(500).json({ message: "Server error while updating admin" });
  }
});

// RESET PASSWORD
app.post("/reset-password", async (req, res) => {
  const { aadhaar, email, role, newPassword } = req.body;

  if (!aadhaar || !email || !role || !newPassword) {
    return res.status(400).json({ message: "Aadhaar, email, role, and password are required" });
  }

  try {
    const connection = await pool.getConnection();
    try {
      const table = role === "superadmin" ? "superadmin" : "admins";
      const idField = role === "superadmin" ? "super_admin" : "admin_id";
      const [rows] = await connection.query(
        `SELECT ${idField} FROM ${table} WHERE aadhaar_no = ? AND email = ? LIMIT 1`,
        [aadhaar, email]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          message: "No matching user found with given Aadhaar and email",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await connection.query(
        `UPDATE ${table} SET password = ?, updated_at = ? WHERE ${idField} = ?`,
        [hashedPassword, new Date().toISOString(), rows[0][idField]]
      );

      res.json({ message: "Password reset successful" });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error during password reset" });
  }
});

// UPDATE VACCINATION (MOTHER)
app.post("/update-vaccine", async (req, res) => {
  const { motherId, dose } = req.query;
  const { status, date_schedule } = req.body;

  if (!motherId || !dose) {
    return res.status(400).json({ message: "Missing motherId or dose" });
  }

  try {
    const connection = await pool.getConnection();
    try {
      const [existingRows] = await connection.query(
        "SELECT mother_id FROM mothers WHERE mother_id = ?",
        [motherId]
      );
      if (existingRows.length === 0) {
        return res.status(404).json({ message: "Mother not found" });
      }

      const [vaccineRows] = await connection.query(
        "SELECT mother_id FROM mothers_vaccination WHERE mother_id = ? AND vaccine = ?",
        [motherId, dose]
      );

      if (vaccineRows.length > 0) {
        await connection.query(
          "UPDATE mothers_vaccination SET status = ?, date_schedule = ? WHERE mother_id = ? AND vaccine = ?",
          [status ? "True" : "False", date_schedule || null, motherId, dose]
        );
      } else {
        await connection.query(
          "INSERT INTO mothers_vaccination (mother_id, vaccine, status, date_schedule) VALUES (?, ?, ?, ?)",
          [motherId, dose, status ? "True" : "False", date_schedule || null]
        );
      }

      res.json({ success: true, message: "Vaccination updated successfully" });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error saving vaccination:", err);
    res.status(500).json({ success: false, message: "Error saving vaccination" });
  }
});

// GET VACCINATION (MOTHER)
app.get("/get-vaccine", async (req, res) => {
  const { motherId, dose } = req.query;
  if (!motherId || !dose) {
    return res.status(400).json({ message: "Missing motherId or dose" });
  }

  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT status, date_schedule FROM mothers_vaccination WHERE mother_id = ? AND vaccine = ?",
        [motherId, dose]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "No vaccine record found" });
      }

      res.json({
        status: rows[0].status === "True",
        date_schedule: rows[0].date_schedule,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching vaccine record:", error);
    res.status(500).json({ message: "Server error fetching vaccine record" });
  }
});

// GET HEALTH DATA (MOTHER)
app.get("/get-health-data", authenticateAdmin, async (req, res) => {
  const { motherId } = req.query;

  try {
    const connection = await pool.getConnection();
    try {
      const [motherRows] = await connection.query(
        "SELECT mother_id, admin_id FROM mothers WHERE mother_id = ?",
        [motherId]
      );
      if (motherRows.length === 0) {
        return res.status(404).json({ success: false, message: "Mother not found" });
      }

      const motherData = motherRows[0];
      if (req.user.role === "admin" && req.user.admin_id !== motherData.admin_id) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      const [healthRows] = await connection.query(
        "SELECT * FROM mothers_health_data WHERE mother_id = ? ORDER BY date ASC",
        [motherId]
      );

      const records = healthRows.map((row) => ({
        mother_id: row.mother_id,
        date: row.date,
        temperature: row.temperature,
        height: row.height,
        weight: row.weight,
        bmi: row.bmi,
        spo2: row.spo2,
        pulse: row.pulse,
        hemoglobin: row.hemoglobin,
      }));

      return res.json({ success: true, records });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching health data:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET CHILD BY ID
app.get("/get-child", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ message: "Child ID is required" });

  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT * FROM children WHERE child_id = ?",
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: "Child not found" });
      }

      const data = rows[0];
      res.json(data);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching child:", error);
    res.status(500).json({ message: "Error fetching child data" });
  }
});

// UPDATE VACCINATION (CHILD)
app.post("/update-child-vaccine", async (req, res) => {
  const { childId, vaccine } = req.query;
  const { status, date_schedule } = req.body;

  if (!childId || !vaccine) {
    return res.status(400).json({ success: false, message: "Missing childId or vaccine" });
  }

  try {
    const connection = await pool.getConnection();
    try {
      const [childRows] = await connection.query(
        "SELECT child_id FROM children WHERE child_id = ?",
        [childId]
      );
      if (childRows.length === 0) {
        return res.status(404).json({ success: false, message: "Child not found" });
      }

      const [vaccineRows] = await connection.query(
        "SELECT child_id FROM children_vaccination WHERE child_id = ? AND vaccine = ?",
        [childId, vaccine]
      );

      const now = new Date().toISOString();
      if (vaccineRows.length > 0) {
        await connection.query(
          "UPDATE children_vaccination SET status = ?, date_schedule = ?, updated_at = ? WHERE child_id = ? AND vaccine = ?",
          [status ? "True" : "False", date_schedule || null, now, childId, vaccine]
        );
      } else {
        await connection.query(
          "INSERT INTO children_vaccination (child_id, vaccine, status, date_schedule, updated_at) VALUES (?, ?, ?, ?, ?)",
          [childId, vaccine, status ? "True" : "False", date_schedule || null, now]
        );
      }

      return res.json({ success: true });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error updating vaccination:", error);
    return res.status(500).json({ success: false, message: "Error updating vaccine" });
  }
});

// SEND WELCOME EMAIL
app.post("/send-welcome", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required" });
  }

  const message = `
Hello ${name},

🎉 Congratulations! You are now registered in the *Health 360 Kiosk*.

We will take care of your health updates, vaccination tracking, and regular follow-ups.

Stay healthy and connected!

– Health 360 Kiosk Team
`;

  const mailOptions = {
    from: "health.kiosk2025@gmail.com",
    to: email,
    subject: "🎉 Welcome to Health 360 Kiosk",
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Welcome email sent" });
  } catch (err) {
    console.error("Error sending welcome email:", err);
    res.status(500).json({ message: "Failed to send welcome email" });
  }
});

// SEND HEALTH UPDATE
app.post("/send-health-update", async (req, res) => {
  const { email, name, date, healthData, vaccineData } = req.body;

  const emailBody = `
Hello ${name},

🩺 Here is your health update from Health Kiosk 360:

📅 Date: ${date}
${Object.entries(healthData).map(([k, v]) => `- ${k.replace(/_/g, " ")}: ${v}`).join("\n")}

💉 Vaccination:
${vaccineData.length > 0 ? vaccineData.map((v) => `- ${v.name}: ${v.date}`).join("\n") : "No vaccination recorded."}

Stay healthy!

– Health Kiosk 360 Team
`;

  const mailOptions = {
    from: "health.kiosk2025@gmail.com",
    to: email,
    subject: `🧾 Health Report - ${date}`,
    text: emailBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.send({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Email send error:", error);
    res.status(500).send({ success: false, error: "Failed to send email" });
  }
});

app.get("/", (req, res) => {
  res.send("🚀 Health360 Backend is running successfully!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});