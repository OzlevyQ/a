import fs from 'fs-extra';
import path from 'path';

const SESSION_PATH = path.join(process.cwd(), '.wwebjs_auth');
const CONNECTION_INFO_PATH = path.join(process.cwd(), 'whatsapp-connection.json');

console.log('=== Path Debug Information ===');
console.log('Current working directory:', process.cwd());
console.log('SESSION_PATH:', SESSION_PATH);
console.log('CONNECTION_INFO_PATH:', CONNECTION_INFO_PATH);

console.log('\n=== File Existence Check ===');
console.log('Session folder exists:', await fs.pathExists(SESSION_PATH));
console.log('Connection file exists:', await fs.pathExists(CONNECTION_INFO_PATH));

if (await fs.pathExists(CONNECTION_INFO_PATH)) {
  try {
    const data = await fs.readJson(CONNECTION_INFO_PATH);
    console.log('\n=== Connection File Content ===');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Error reading connection file:', error.message);
  }
} 