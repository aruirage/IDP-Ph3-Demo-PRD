// Vercel can provide rewrite parameters on req.query separately from req.url.
export function parseVercelRequest(req){
 const url=new URL(req.url||'/','http://localhost'),query=new URLSearchParams();
 for(const [key,value] of Object.entries(req.query||{}))for(const item of Array.isArray(value)?value:[value])if(item!==undefined)query.append(key,String(item));
 // The original URL wins over a route capture with the same name.
 for(const key of new Set(url.searchParams.keys())){query.delete(key);for(const value of url.searchParams.getAll(key))query.append(key,value);}
 return {pathname:query.get('__route')||query.get('__path')||url.pathname,query};
}
