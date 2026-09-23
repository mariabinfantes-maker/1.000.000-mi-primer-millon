import { readFileSync, readdirSync, writeFileSync } from "node:fs";
const R="/home/user/1.000.000-mi-primer-millon";
const V=JSON.parse(readFileSync(R+"/data/vocabulario/vocabulario.json","utf8"));
const etq=new Map(V.capacidades.map(c=>[c.id,c.etiqueta]));
const dom=new Map(V.capacidades.map(c=>[c.id,c.dominioId]));
const CATS=JSON.parse(readFileSync(R+"/data/categorias.json","utf8"));
const NOM=Object.fromEntries((Array.isArray(CATS)?CATS:(CATS.categorias||Object.values(CATS)[0])).map(c=>[c.id,c.nombre||c.titulo]));
const out=[],malas=[];
for(const f of readdirSync("dirigidas").filter(x=>x.endsWith(".json")&&!x.startsWith("_"))){
 const d=JSON.parse(readFileSync("dirigidas/"+f,"utf8"));
 let t=(d.texto||"").trim().replace(/^```(json)?/,"").replace(/```$/,"").trim();
 let p=null; try{p=JSON.parse(t.slice(t.indexOf("{"),t.lastIndexOf("}")+1));}catch(e){}
 if(!p||!Array.isArray(p.resultados)){malas.push(d.nombre+" / "+d.casa);continue;}
 for(const r of p.resultados){ if(!etq.has(r.id)) continue;
  out.push({herramienta:d.nombre,id:d.herramientaId,casa:d.casa,cap:r.id,etiqueta:etq.get(r.id),
   estado:(r.estado==="si"&&r.cita&&r.cita.length>5)?"si":"no_consta",cita:r.cita||null,
   url:r.url||d.urls[0],leidas:(d.leidas||[]).filter(u=>u.startsWith("OK")).length});}
}
writeFileSync("resultados-dirigidas.json",JSON.stringify(out,null,1));
const si=out.filter(r=>r.estado==="si");
console.log("respuestas "+out.length+" · demostradas "+si.length+(malas.length?" · ilegibles: "+malas.join("; "):""));
// Cuántos de los 150 pares (herramienta,casa) quedan confirmados
const pares=new Map();
for(const r of out){const k=r.id+"|"+r.casa; if(!pares.has(k))pares.set(k,0); if(r.estado==="si")pares.set(k,pares.get(k)+1);}
const conf=[...pares.values()].filter(v=>v>0).length;
console.log("pares comprobados: "+pares.size+" · con al menos una capacidad demostrada: "+conf+" · sin nada: "+(pares.size-conf));
console.log("\nCASA                                    pares  confirmados  capacidades");
const porCasa={};
for(const [k,v] of pares){const c=k.split("|")[1]; porCasa[c]=porCasa[c]||{n:0,c:0,caps:0}; porCasa[c].n++; if(v>0)porCasa[c].c++; porCasa[c].caps+=v;}
for(const [c,x] of Object.entries(porCasa).sort((a,b)=>b[1].c-a[1].c))
 console.log(NOM[c].padEnd(40)+String(x.n).padStart(5)+String(x.c).padStart(13)+String(x.caps).padStart(13));
