import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const app = express();
app.use(cors());
app.use(express.json());

// In-memory caches (swap for Redis if you like)
const cache = new Map();
const put = (k,v,ms=60000)=>cache.set(k,{v,exp:Date.now()+ms});
const get = (k)=>{ const x=cache.get(k); if(!x) return; if(Date.now()>x.exp){cache.delete(k);return;} return x.v; };

// ---- Vendors ----
const Vendors = ['S&S','SanMar'];
app.get('/vendors', (_,res)=>res.json(Vendors));

// Import vendor adapters (implementations below)
import * as SANDS from './adapters/sands.js';
import * as SANMAR from './adapters/sanmar.js';

const pick = (vendor) => vendor === 'SanMar' ? SANMAR : SANDS;

app.get('/styles/lookup', async (req,res)=>{
  try {
    const { vendor, brand, code } = req.query;
    const api = pick(vendor);
    const style = await api.lookupStyle({ brand, code });
    res.json(style); // { id, code, name }
  } catch (e){ res.status(500).json({error:e.message}); }
});

app.get('/sizes', async (req,res)=>{
  try {
    const { vendor, style_id } = req.query;
    const api = pick(vendor);
    res.json(await api.sizes({ style_id }));
  } catch (e){ res.status(500).json({error:e.message}); }
});

app.get('/colors', async (req,res)=>{
  try {
    const { vendor, style_id } = req.query;
    const api = pick(vendor);
    res.json(await api.colors({ style_id }));
  } catch (e){ res.status(500).json({error:e.message}); }
});

app.get('/inventory', async (req,res)=>{
  try {
    const { vendor, style_id, color } = req.query;
    const api = pick(vendor);
    const key = `inv:${vendor}:${style_id}:${color}`;
    const hit = get(key); if (hit) return res.json(hit);
    const data = await api.inventory({ style_id, color });
    put(key, data, 5*60*1000); // 5 min
    res.json(data);
  } catch (e){ res.status(500).json({error:e.message}); }
});

app.post('/pricing/quote', async (req,res)=>{
  try {
    const { sizes=[], qtys=[], placement } = req.body;
    const totalQty = qtys.reduce((a,x)=>a+(+x||0),0);
    const base = 600; // cents (placeholder)
    const sizeUp = (s)=> s.includes('2XL')?150 : s.includes('3XL')?250 : s.includes('4XL')?350 : 0;
    const print = placement?400:0;
    const unitCost = (i)=> base + sizeUp(sizes[i]);
    const sellMult = totalQty>=144?1.30 : totalQty>=72?1.35 : totalQty>=36?1.40 : 1.45;
    const costTotal = qtys.reduce((sum,q,i)=> sum + q*(unitCost(i)+print), 0);
    const sellTotal = Math.round(costTotal*sellMult);
    const sellPer = totalQty? Math.ceil((sellTotal/totalQty)/25)*25 : 0; // round to $0.25
    const margin = sellTotal? (1 - (costTotal/sellTotal))*100 : 0;
    res.json({ sell_per: sellPer/100, sell_total: sellTotal/100, cost_per: totalQty?Math.round(costTotal/totalQty)/100:0, cost_total: costTotal/100, margin_pct: margin, notes: '' });
  } catch (e){ res.status(500).json({error:e.message}); }
});

app.listen(process.env.PORT||3000, ()=>console.log('Sync service running'));