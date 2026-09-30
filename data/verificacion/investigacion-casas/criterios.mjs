import { readFileSync, readdirSync, writeFileSync } from "node:fs";
const R="/home/user/1.000.000-mi-primer-millon";
const N=JSON.parse(readFileSync(R+"/data/vocabulario/necesidades.json","utf8"));
const regs=JSON.parse(readFileSync(R+"/data/verificacion/registros.json","utf8"));
const fichas=readdirSync(R+"/data/herramientas").filter(f=>f.endsWith(".json"))
 .map(f=>JSON.parse(readFileSync(R+"/data/herramientas/"+f,"utf8"))).filter(h=>h.estado==="activo");

// CRITERIO 2 — quiénes somos: sólo lo que F2 verificó. El folleto no coloca a nadie.
const demo=new Map();
for(const r of regs){ if(r.estado!=="verificado"||r.profundidad==="no_disponible") continue;
 if(!demo.has(r.herramientaId)) demo.set(r.herramientaId,new Set());
 demo.get(r.herramientaId).add(r.capacidadId); }

// CRITERIO 1 — de qué servimos: cubrir la necesidad entera, no rozar el dominio.
const cubre=(h,nec)=>{ const d=demo.get(h.id)??new Set();
 return nec.imprescindibles.length>0 && nec.imprescindibles.every(c=>d.has(c)); };

const porPuerta={}; for(const p of N.puertas) porPuerta[p.id]={titulo:p.titulo,necesidades:[],herramientas:new Set()};
const necCubiertas=[];
for(const nec of N.necesidades){
 const quienes=fichas.filter(h=>cubre(h,nec));
 necCubiertas.push({id:nec.id,titulo:nec.titulo,puertas:nec.puertas,n:quienes.length,quienes:quienes.map(h=>h.nombre)});
 for(const p of nec.puertas){ if(!porPuerta[p]) continue;
  porPuerta[p].necesidades.push({id:nec.id,titulo:nec.titulo,n:quienes.length});
  for(const h of quienes) porPuerta[p].herramientas.add(h.nombre); }
}

console.log("LAS 6 PUERTAS — quién cubre de verdad alguna de sus necesidades\n");
console.log("PUERTA                        necesidades  cubiertas  herramientas");
for(const [id,p] of Object.entries(porPuerta)){
 const cub=p.necesidades.filter(x=>x.n>0).length;
 console.log(p.titulo.padEnd(30)+String(p.necesidades.length).padStart(9)+String(cub).padStart(11)+String(p.herramientas.size).padStart(14));
}
const sinNadie=necCubiertas.filter(x=>x.n===0);
console.log("\nNecesidades: "+N.necesidades.length+" · cubiertas por alguien: "+(N.necesidades.length-sinNadie.length)+" · por NADIE: "+sinNadie.length);
const sinCasa=fichas.filter(h=>!Object.values(porPuerta).some(p=>p.herramientas.has(h.nombre)));
console.log("Herramientas que no cubren ninguna necesidad entera: "+sinCasa.length+"/65");
writeFileSync("porNecesidad.json",JSON.stringify({porPuerta:Object.fromEntries(Object.entries(porPuerta).map(([k,v])=>[k,{...v,herramientas:[...v.herramientas]}])),necesidades:necCubiertas,sinCasa:sinCasa.map(h=>h.nombre)},null,1));

// CRITERIO 3 — a quién asesoramos: se anota, no se filtra. No somos jueces.
const num=s=>{const m=String(s||"").match(/([\d]+(?:[.,]\d+)?)/);return m?parseFloat(m[1].replace(",",".")):null;};
const salida={};
for(const [id,p] of Object.entries(porPuerta)){
 const filas=[...p.herramientas].map(nom=>{
  const h=fichas.find(x=>x.nombre===nom);
  const cubre=necCubiertas.filter(n=>n.puertas.includes(id)&&n.quienes.includes(nom));
  return {nombre:nom, necesidades:cubre.map(n=>n.titulo), cuantas:cubre.length,
    entrada:num(h.precioInicial), espanol:!!h.disponibleEnEspanol, curva:h.curvaDeAprendizaje};
 }).sort((a,b)=>b.cuantas-a.cuantas||a.nombre.localeCompare(b.nombre,"es"));
 salida[id]={titulo:p.titulo, sinNadie:p.necesidades.filter(x=>x.n===0).map(x=>x.titulo), herramientas:filas};
}
writeFileSync("distribucion.json",JSON.stringify(salida,null,1));
console.log("\n=== DISTRIBUCIÓN (las que cubren más necesidades de cada puerta) ===");
for(const [id,p] of Object.entries(salida)){
 console.log("\n## "+p.titulo+"   ("+p.herramientas.length+" herramientas · "+p.sinNadie.length+" necesidades sin nadie)");
 for(const f of p.herramientas.slice(0,6))
  console.log("   "+String(f.cuantas)+"  "+f.nombre.padEnd(18)+(f.espanol?"es ":"·  ")+(f.entrada!=null?String(f.entrada).padStart(5):"    ?")+"  "+f.necesidades.join(" / ").slice(0,70));
}
