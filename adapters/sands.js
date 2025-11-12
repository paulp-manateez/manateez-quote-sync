import fetch from 'node-fetch';

const USER = process.env.SANDS_USERNAME;
const KEY  = process.env.SANDS_API_KEY;

function authHeader(){
  const token = Buffer.from(`${USER}:${KEY}`).toString('base64');
  return { 'Authorization': `Basic ${token}` };
}

// ---- TEMP safe responses so the Sheet works ----
export async function lookupStyle({ brand, code }) {
  // Pretend we found it
  return { id: `${brand}-${code}`, code, name: `${brand} ${code}` };
}

export async function sizes({ style_id }) {
  // Common retail size run
  return ['XS','S','M','L','XL','2XL','3XL'];
}

export async function colors({ style_id }) {
  // One color with usable hero URLs so images render
  return [{
    code: 'BLK',
    name: 'Black',
    hero_front_url: 'https://via.placeholder.com/600x600?text=Front+Black',
    hero_back_url:  'https://via.placeholder.com/600x600?text=Back+Black'
  }];
}

export async function inventory({ style_id, color }) {
  // Simple warehouse qtys
  return { NJ: 250, PA: 75, IL: 120 };
}
