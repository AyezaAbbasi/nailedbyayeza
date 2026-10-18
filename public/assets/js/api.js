// Small fetch wrapper used across all pages
const API = '/api';

async function apiGet(path){
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || 'Request failed');
  return res.json();
}
async function apiPost(path, body, isForm){
  const opts = { method:'POST' };
  if (isForm){ opts.body = body; } else { opts.headers = {'Content-Type':'application/json'}; opts.body = JSON.stringify(body); }
  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}