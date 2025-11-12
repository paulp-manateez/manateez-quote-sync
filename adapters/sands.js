import fetch from 'node-fetch';

const BASE = process.env.SANDS_BASE_URL || 'https://api.ssactivewear.com/v2'; // adjust if needed
const USER = process.env.SANDS_USERNAME;   // ← your S&S username
const KEY  = process.env.SANDS_API_KEY;    // ← your S&S API key

function authHeader(){
  const token = Buffer.from(`${USER}:${KEY}`).toString('base64');
  return { 'Authorization': `Basic ${token}` };
}

async function j(path){
  const res = await fetch(`${BASE}${path}`, { headers: { ...authHeader() } });
  if (!res.ok) throw new Error(`[S&S ${res.status}] ${await res.text()}`);
  return res.json();
}

// ---- Implement these to match your S&S endpoints ----
export async function lookupStyle({ brand, code }){
  // Example: filter products/styles by brand & style code
  const data = await j(`/styles?brand=${encodeURIComponent(brand)}&style=${encodeURIComponent(code)}`);
  const s = Array.isArray(data) ? data[0] : data; // pick first match
  return { id: s.id || `${brand}-${code}`, code: s.style || code, name: s.description || `${brand} ${code}` };
}

export async function sizes({ style_id }){
  // Example: sizes list for a style
  const data = await j(`/styles/${encodeURIComponent(style_id)}/sizes`);
  return (data.sizes || data || []).map(x => x.code || x).sort((a,b)=>['XS','S','M','L','XL','2XL','3XL','4XL'].indexOf(a)-['XS','S','M','L','XL','2XL','3XL','4XL'].indexOf(b));
}

export async function colors({ style_id }){
  // Example: colorways for a style, include swatch and hero images if provided by API
  const data = await j(`/styles/${encodeURIComponent(style_id)}/colors`);
  return (data.colors || data || []).map(c => ({
    code: c.code || c.colorCode,
    name: c.name || c.colorName,
    swatch_url: c.swatchUrl || c.swatch_url || '',
    hero_front_url: c.frontImage || c.heroFrontUrl || '',
    hero_back_url:  c.backImage  || c.heroBackUrl  || ''
  }));
}

export async function inventory({ style_id, color }){
  // Example: inventory by warehouse
  const data = await j(`/inventory?style_id=${encodeURIComponent(style_id)}&color=${encodeURIComponent(color)}`);
  // Normalize to { WH: qty, ... }
  const out = {};
  (data.warehouses || data || []).forEach(w => { out[w.code || w.warehouse] = w.onHand || w.qty || 0; });
  return out;
}



https://promostandards.ssactivewear.com/productdata/v2/productdataservicev2.svc 

https://promostandards.ssactivewear.com/inventory/v2/inventoryservice.svc 

https://promostandards.ssactivewear.com/mediacontent/v1/mediacontentservice.svc