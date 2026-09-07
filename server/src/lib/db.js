import sql from "mssql";

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT),
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool = null;

export async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
    console.log("✅ Connected to MSSQL database");
  }
  return pool;
}

export async function initDatabase() {
  const pool = await getPool();

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
    BEGIN
      CREATE TABLE Users (
        user_id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(255) NOT NULL UNIQUE,
        phone NVARCHAR(50) UNIQUE,
        created_at DATETIME2 DEFAULT GETDATE()
      );
    END
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Proxy')
    BEGIN
      CREATE TABLE Proxy (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        sid INT NOT NULL,
        ip_port NVARCHAR(100),
        user_pass NVARCHAR(500),
        country NVARCHAR(10),
        type NVARCHAR(50),
        created NVARCHAR(20),
        expired NVARCHAR(20),
        status NVARCHAR(50),
        note NVARCHAR(500),
        CONSTRAINT FK_Proxy_Users FOREIGN KEY (user_id) REFERENCES Users(user_id),
        CONSTRAINT UQ_Proxy_user_sid UNIQUE (user_id, sid)
      );
      CREATE INDEX IX_Proxy_user_id ON Proxy(user_id);
    END
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Vps')
    BEGIN
      CREATE TABLE Vps (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        sid INT NOT NULL,
        plan_number NVARCHAR(100),
        ip_port NVARCHAR(100),
        user_pass NVARCHAR(500),
        country NVARCHAR(10),
        he_dieu_hanh NVARCHAR(50),
        price_vnd NVARCHAR(50),
        created NVARCHAR(20),
        expired NVARCHAR(20),
        status NVARCHAR(50),
        note NVARCHAR(500),
        CONSTRAINT FK_Vps_Users FOREIGN KEY (user_id) REFERENCES Users(user_id),
        CONSTRAINT UQ_Vps_user_sid UNIQUE (user_id, sid)
      );
      CREATE INDEX IX_Vps_user_id ON Vps(user_id);
    END
  `);

  // Auto-migration: ensure user_pass is NVARCHAR(500) for encrypted payloads
  await pool.request().query(`
    IF EXISTS (
      SELECT 1 FROM sys.columns 
      WHERE object_id = OBJECT_ID('Proxy') AND name = 'user_pass' AND max_length < 1000
    )
    BEGIN
      ALTER TABLE Proxy ALTER COLUMN user_pass NVARCHAR(500);
    END;

    IF EXISTS (
      SELECT 1 FROM sys.columns 
      WHERE object_id = OBJECT_ID('Vps') AND name = 'user_pass' AND max_length < 1000
    )
    BEGIN
      ALTER TABLE Vps ALTER COLUMN user_pass NVARCHAR(500);
    END;

    IF NOT EXISTS (
      SELECT 1 FROM sys.columns 
      WHERE object_id = OBJECT_ID('Users') AND name = 'last_vps_synced_at'
    )
    BEGIN
      ALTER TABLE Users ADD last_vps_synced_at DATETIME2 NULL;
    END;

    IF NOT EXISTS (
      SELECT 1 FROM sys.columns 
      WHERE object_id = OBJECT_ID('Users') AND name = 'last_proxy_synced_at'
    )
    BEGIN
      ALTER TABLE Users ADD last_proxy_synced_at DATETIME2 NULL;
    END;
  `);

  console.log("✅ Database tables initialized");
}
