import { readFileSync, readdirSync, writeFileSync } from "node:fs";
const R="/home/user/1.000.000-mi-primer-millon";
const V=JSON.parse(readFileSync(R+"/data/vocabulario/vocabulario.json","utf8"));
const regs=JSON.parse(readFileSync(R+"/data/verificacion/registros.json","utf8"));
const decl=new Map(JSON.parse(readFileSync("declarado.json","utf8")).map(d=>[d.id,d]));
const CATS=JSON.parse(readFileSync(R+"/data/categorias.json","utf8"));
const lista=Array.isArray(CATS)?CATS:(CATS.categorias||Object.values(CATS)[0]);
const NOM=Object.fromEntries(lista.map(c=>[c.id,c.nombre||c.titulo]));

const DOM={"crm":["clientes","presupuestos"],"gestion-proyectos":["trabajo","comunicacion-interna"],
 "asistentes-ia":["contenido"],"facturacion-contabilidad":["facturacion","costes"],
 "reservas-citas":["citas"],"atencion-cliente":["atencion"],"comercio-electronico":["comercio"],
 "automatizacion-integraciones":["automatizacion","datos"],"marketing-email":["marketing"],
 "recursos-humanos":["personas"],"inventario-operaciones":["inventario","produccion","activos","servicio-campo"],
 "creacion-web-hosting":["presencia"],"firma-gestion-documental":["documentos"],
 "software-sectorial":["salud","formacion"]};

const domDe=new Map(V.capacidades.map(c=>[c.id,c.dominioId]));
const demo=new Map();
for(const r of regs){ if(r.estado!=="verificado"||r.profundidad==="no_disponible") continue;
 const d=domDe.get(r.capacidadId); if(!d) continue;
 if(!demo.has(r.herramientaId)) demo.set(r.herramientaId,[]);
 demo.get(r.herramientaId).push(d); }

const fichas=readdirSync(R+"/data/herramientas").filter(f=>f.endsWith(".json"))
 .map(f=>JSON.parse(readFileSync(R+"/data/herramientas/"+f,"utf8"))).filter(h=>h.estado==="activo");

const filas=fichas.map(h=>{
 const doms=demo.get(h.id)??[]; const d=decl.get(h.id);
 const sirve=[], porComprobar=[];
 for(const [c,dd] of Object.entries(DOM)){
  const ver=doms.filter(x=>dd.includes(x)).length;
  if(ver>0 || d?.esDe===c) sirve.push(c);
  else if(d?.casas.includes(c)) porComprobar.push(c);
 }
 // Todo en uno: sirve a media docena de casas o más. Es un hecho contable, no una opinión.
 if(sirve.length>=6) sirve.push("plataformas-todo-en-uno");
 return {id:h.id,nombre:h.nombre,sirve,porComprobar,hoy:h.categoriaId};
});
writeFileSync("reparto.json",JSON.stringify({casas:NOM,filas},null,1));

console.log("CASA                                      hoy   está   por comprobar");
for(const c of Object.keys(NOM)){
 const n=filas.filter(f=>f.sirve.includes(c)).length;
 const p=filas.filter(f=>f.porComprobar.includes(c)).length;
 const hoy=filas.filter(f=>f.hoy===c).length;
 console.log(NOM[c].padEnd(40)+String(hoy).padStart(4)+String(n).padStart(7)+String(p).padStart(15));
}
const n=filas.map(f=>f.sirve.length);
console.log("\nCada herramienta está en "+(n.reduce((a,b)=>a+b,0)/n.length).toFixed(1)+" casas de media · máx "+Math.max(...n)+" · mín "+Math.min(...n));
console.log("Herramientas en 6 casas o más (todo en uno): "+filas.filter(f=>f.sirve.includes("plataformas-todo-en-uno")).length);
