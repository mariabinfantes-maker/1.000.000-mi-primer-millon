import { readFileSync, readdirSync, writeFileSync } from "node:fs";
const R="/home/user/1.000.000-mi-primer-millon";
const V=JSON.parse(readFileSync(R+"/data/vocabulario/vocabulario.json","utf8"));
const regs=JSON.parse(readFileSync(R+"/data/verificacion/registros.json","utf8"));
const decl=JSON.parse(readFileSync("declarado.json","utf8"));

const CASAS={
 "crm":["clientes","presupuestos"],"gestion-proyectos":["trabajo"],
 "asistentes-ia":["contenido"],"facturacion-contabilidad":["facturacion","costes"],
 "reservas-citas":["citas"],"atencion-cliente":["atencion"],"comercio-electronico":["comercio"],
 "automatizacion-integraciones":["automatizacion","datos"],"marketing-email":["marketing"],
 "recursos-humanos":["personas"],"inventario-operaciones":["inventario","produccion","activos","servicio-campo"],
 "creacion-web-hosting":["presencia"],"firma-gestion-documental":["documentos"],
 "software-sectorial":["salud","formacion"]};
const NOM={"crm":"CRM y ventas","gestion-proyectos":"Gestión de proyectos","asistentes-ia":"IA y contenido",
 "facturacion-contabilidad":"Facturación y contabilidad","reservas-citas":"Reservas y citas",
 "atencion-cliente":"Atención al cliente","comercio-electronico":"Comercio electrónico",
 "automatizacion-integraciones":"Automatización e integraciones","marketing-email":"Marketing y email",
 "recursos-humanos":"Recursos humanos","inventario-operaciones":"Inventario y operaciones",
 "creacion-web-hosting":"Creación web y hosting","firma-gestion-documental":"Firma y documental",
 "software-sectorial":"Software sectorial"};

const domDe=new Map(V.capacidades.map(c=>[c.id,c.dominioId]));
const demo=new Map();
for(const r of regs){ if(r.estado!=="verificado"||r.profundidad==="no_disponible") continue;
 const d=domDe.get(r.capacidadId); if(!d) continue;
 if(!demo.has(r.herramientaId)) demo.set(r.herramientaId,[]);
 demo.get(r.herramientaId).push(d); }

const declDe=new Map(decl.map(d=>[d.id,d]));
const fichas=readdirSync(R+"/data/herramientas").filter(f=>f.endsWith(".json"))
 .map(f=>JSON.parse(readFileSync(R+"/data/herramientas/"+f,"utf8"))).filter(h=>h.estado==="activo");

const filas=fichas.map(h=>{
 const doms=demo.get(h.id)??[]; const d=declDe.get(h.id);
 const casas={};
 for(const [c,dd] of Object.entries(CASAS)){
  const verificadas=doms.filter(x=>dd.includes(x)).length;
  const declara=d?d.casas.includes(c):false;
  const oficio=d?d.esDe===c:false;
  let nivel=null;
  if(oficio) nivel="oficio";
  else if(verificadas>0&&declara) nivel="lo-hace";
  else if(verificadas>0) nivel="lo-hace";
  else if(declara) nivel="lo-trae";
  if(nivel) casas[c]={nivel,verificadas,cita:d?.citas?.[c]??null};
 }
 return {id:h.id,nombre:h.nombre,sinRespuesta:!d,sector:d?.sector??null,capacidadesVerificadas:doms.length,casas};
});
writeFileSync("asignacion.json",JSON.stringify({casas:NOM,filas},null,1));

console.log("CASA                              oficio  lo-hace  lo-trae  =TOTAL");
for(const c of Object.keys(CASAS)){
 const f=filas.filter(x=>x.casas[c]);
 const o=f.filter(x=>x.casas[c].nivel==="oficio").length;
 const h=f.filter(x=>x.casas[c].nivel==="lo-hace").length;
 const t=f.filter(x=>x.casas[c].nivel==="lo-trae").length;
 console.log(NOM[c].padEnd(33)+String(o).padStart(5)+String(h).padStart(8)+String(t).padStart(9)+String(f.length).padStart(8));
}
const n=filas.map(f=>Object.keys(f.casas).length);
console.log("\nMedia "+(n.reduce((a,b)=>a+b,0)/n.length).toFixed(1)+" casas · máx "+Math.max(...n)+" · sin casa: "+n.filter(x=>x===0).length);
console.log("Sin respuesta de investigación: "+filas.filter(f=>f.sinRespuesta).length);
const nuc=filas.filter(f=>!Object.values(f.casas).some(c=>c.nivel==="oficio"));
console.log("Sin oficio identificado: "+nuc.length+(nuc.length?" → "+nuc.map(f=>f.nombre).join(", "):""));
