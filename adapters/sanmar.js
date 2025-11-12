export async function lookupStyle({ brand, code }){
  // TODO: call SanMar API; return {id, code, name}
  return { id: `sanmar-${brand}-${code}`, code, name: `${brand} ${code}` };
}
export async function sizes({ style_id }){ return ['XS','S','M','L','XL','2XL','3XL']; }
export async function colors({ style_id }){
  return [{ code:'BLK', name:'Black', swatch_url:'', hero_front_url:'https://via.placeholder.com/600x600?text=Front', hero_back_url:'https://via.placeholder.com/600x600?text=Back' }];
}
export async function inventory(){ return { NJ: 312, PA: 44 }; }