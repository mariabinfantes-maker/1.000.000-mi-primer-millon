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

const etq=new Map(V.capacidades.map(c=>[c.id,c.etiqueta]));
// Capacidades que definen una casa pero viven en otro dominio. La firma
// electrónica está en `presupuestos` (firmar un presupuesto), y sin ella la
// casa de firma no podía demostrar lo que su nombre promete.
const EXTRA={"firma-gestion-documental":["cap.electronic_signature"]};
const capsDeCasa=Object.fromEntries(Object.entries(DOM).map(([c,dd])=>
 [c, [...V.capacidades.filter(x=>dd.includes(x.dominioId)).map(x=>x.id), ...(EXTRA[c]??[])]]));

// La pasada del 23-09: se incorpora como verificación igual que la de F2,
// con su cita y su URL guardadas en resultados.json.
const nuevos=[...JSON.parse(readFileSync("/tmp/claude-0/-home-user-1-000-000-mi-primer-millon/ab1c1d42-b597-536e-a467-9fde178942ad/scratchpad/casas/resultados.json","utf8")),
 ...JSON.parse(readFileSync("/tmp/claude-0/-home-user-1-000-000-mi-primer-millon/ab1c1d42-b597-536e-a467-9fde178942ad/scratchpad/casas/resultados-dirigidas.json","utf8"))];
const ver=new Map();  // herramienta -> Set(capacidad verificada)
for(const r of nuevos){ if(r.estado!=="si") continue;
 if(!ver.has(r.id)) ver.set(r.id,new Set()); ver.get(r.id).add(r.cap); }
for(const r of regs){ if(r.estado!=="verificado"||r.profundidad==="no_disponible") continue;
 if(!ver.has(r.herramientaId)) ver.set(r.herramientaId,new Set());
 ver.get(r.herramientaId).add(r.capacidadId); }

const fichas=readdirSync(R+"/data/herramientas").filter(f=>f.endsWith(".json"))
 .map(f=>JSON.parse(readFileSync(R+"/data/herramientas/"+f,"utf8"))).filter(h=>h.estado==="activo");

const filas=fichas.map(h=>{
 const mias=ver.get(h.id)??new Set(); const d=decl.get(h.id);
 const casas={};
 for(const [c,caps] of Object.entries(capsDeCasa)){
  const cubre=caps.filter(k=>mias.has(k)).map(k=>etq.get(k));
  const sinComprobar=caps.filter(k=>!mias.has(k)).map(k=>etq.get(k));
  const esSuOficio=d?.esDe===c;
  if(cubre.length===0 && !esSuOficio) continue;
  casas[c]={
   // REGLA 1 (propietaria, 2026-09-23): estar en la casa no dice "sirve".
   // Dice QUÉ cubre. Crear documentos no demuestra poder firmarlos.
   cubre, sinComprobar, esSuOficio,
   apoyo: cubre.length>0 ? "verificado" : "solo-su-portada",
  };
 }
 return {id:h.id,nombre:h.nombre,casas,hoy:h.categoriaId};
});
writeFileSync("reparto.json",JSON.stringify({casas:NOM,filas},null,1));

console.log("CASA                                    está  de ellas sólo por su portada");
for(const c of Object.keys(NOM)){
 if(c==="plataformas-todo-en-uno"){console.log("Plataformas todo en uno".padEnd(40)+"   —   (sin regla: ver nota)");continue;}
 const f=filas.filter(x=>x.casas[c]);
 const sp=f.filter(x=>x.casas[c].apoyo==="solo-su-portada").length;
 console.log(NOM[c].padEnd(40)+String(f.length).padStart(4)+String(sp).padStart(8));
}
console.log("\n### Firma electrónica y gestión documental — qué cubre cada una");
for(const f of filas.filter(x=>x.casas["firma-gestion-documental"])){
 const k=f.casas["firma-gestion-documental"];
 console.log("  "+f.nombre.padEnd(16)+"cubre: "+(k.cubre.join(", ")||"—")+"\n"+" ".repeat(18)+"sin comprobar: "+k.sinComprobar.join(", "));
}
