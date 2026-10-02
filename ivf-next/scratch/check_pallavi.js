const fs = require('fs');
const sql = require('mssql');

const envPath = 'c:\\Users\\Manish Dayalkar\\Desktop\\ivf_ng\\ivf-next\\.env.local';
const env = fs.readFileSync(envPath, 'utf-8');
env.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim();
});

const sqlConfig = {
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT) || 8463,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: { encrypt: false, trustServerCertificate: true }
};

async function check() {
  const pool = await sql.connect(sqlConfig);
  const res = await pool.request().query("SELECT PatID, CycID, CycOType FROM CycOutCome WHERE PatID = 2");
  console.log('Pallavi Kharat Cycles in CycOutCome:\n', res.recordset);

  const res2 = await pool.request().query("SELECT * FROM CycMonitoringChartRemDay WHERE PatID = 2");
  console.log('CycMonitoringChartRemDay count:', res2.recordset.length);

  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
