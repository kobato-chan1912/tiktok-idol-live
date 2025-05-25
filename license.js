const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { machineIdSync } = require('node-machine-id');
const { app } = require('electron');

const dotenv = require('dotenv');

// __dirname sẽ là đường dẫn tới thư mục trong asar
const envPath = path.join(__dirname, '.env');

// Load thủ công từ đường dẫn cụ thể
dotenv.config({ path: envPath });

const DOMAIN = process.env.DOMAIN;


const LICENSE_FILE = path.join(app.getPath('userData'), 'license.json');
console.log('License file path:', LICENSE_FILE);

function readLicenseKey() {
  if (!fs.existsSync(LICENSE_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(LICENSE_FILE)).license;
  } catch {
    return null;
  }
}

function getMachineId() {
  return machineIdSync();
}

async function checkLicense() {
  const license = readLicenseKey();
  const machine_id = getMachineId();
  const app_name = "tiktok_live";
  console.log('Machine ID:', machine_id);

  if (!license) return { valid: false, licenseType: 'free' };

  try {
    const res = await axios.post(`${DOMAIN}/api/license-key/verify`, {
      license,
      machine_id,
      app_name
    });

    if (res.data.valid) {
      return { valid: true, licenseType: res.data.license_type, expiredDate: res.data.expired_date || null };
    }
  } catch (e) {
    console.error('License check failed:', e.message);
  }

  return { valid: false, licenseType: 'free', expiredDate: null };
}


module.exports = {
    checkLicense,
    readLicenseKey,
    getMachineId,
  };
  