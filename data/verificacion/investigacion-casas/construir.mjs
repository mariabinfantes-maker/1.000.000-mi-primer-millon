import { readFileSync, writeFileSync } from "node:fs";
const R="/home/user/1.000.000-mi-primer-millon";
const V=JSON.parse(readFileSync(R+"/data/vocabulario/vocabulario.json","utf8"));
const etq=new Map(V.capacidades.map(c=>[c.id,c.etiqueta]));
const TOOLS=new Map(JSON.parse(readFileSync("tools.json","utf8")).map(t=>[t.id,t]));
const pares=JSON.parse(readFileSync("pares.json","utf8"));
const prof=new Map(JSON.parse(readFileSync("profundidad.json","utf8")).map(x=>[x.id+"|"+x.cap,x]));

const FECHA="2026-09-23", REVISION="2027-09-23";
const dom=u=>{try{return new URL(u).hostname.replace(/^www\./,"");}catch{return null;}};
/** Una URL ajena al dominio del fabricante no sostiene nada suyo. Si la
 *  respuesta trae otra, se guarda la página que realmente le dimos. */
const oficial=(u,t)=>{const a=dom(u),b=dom(t.url);
 return a&&b&&(a===b||a.endsWith("."+b)||b.endsWith("."+a))?u:t.url;};

const nuevos=[], descartados=[];
/**
 * Teachable queda fuera entero, no por falta de evidencia sino por una
 * decisión escrita de la propietaria: mientras la profundidad de
 * `teachable/cap.payment_collection` esté pendiente, Teachable no tiene
 * ningún registro. Ver `_registros-aprobados-sin-ficha.json` y su prueba.
 * Que ahora haya evidencia suya en otra capacidad es información nueva para
 * ella, no permiso para levantar el bloqueo.
 */
const BLOQUEADAS = new Set(["teachable"]);
for(const p of pares){
 if(BLOQUEADAS.has(p.id)){descartados.push(p.id+": bloqueada por la propietaria");continue;}
 const t=TOOLS.get(p.id); if(!t){descartados.push(p.id+": sin ficha");continue;}
 const fuentes=[];
 if(p.estado==="si"){
  const d=prof.get(p.id+"|"+p.cap); if(!d){descartados.push(p.id+"/"+p.cap+": sin profundidad");continue;}
  fuentes.push({tipo:"pagina_oficial",url:oficial(p.url,t),fechaConsulta:FECHA,cita:p.cita,rol:"capacidad"});
  const esInt=d.profundidad==="integracion";
  // El plan no se preguntó. Se dice que es desconocido y se deja dónde se miró.
  if(!esInt && t.precios) fuentes.push({tipo:"tarifa_oficial",url:t.precios,fechaConsulta:FECHA,rol:"plan_consultado"});
  nuevos.push({herramientaId:p.id,capacidadId:p.cap,estado:"verificado",profundidad:d.profundidad,
   ...(esInt?{integraCon:d.integraCon}:{planEstado:"desconocido"}),
   fuentes,confianza:"alta",proximaRevision:REVISION});
 }else{
  fuentes.push({tipo:"pagina_oficial",url:t.url,fechaConsulta:FECHA});
  if(t.precios) fuentes.push({tipo:"tarifa_oficial",url:t.precios,fechaConsulta:FECHA});
  nuevos.push({herramientaId:p.id,capacidadId:p.cap,estado:"desconocido",fuentes,confianza:"baja",
   proximaRevision:REVISION,
   // La nota habla de la evidencia, no del producto: dice dónde se miró, no
   // lo que la herramienta deja de hacer. Regla de la propietaria (2026-09-09).
   nota:`Se leyeron la página oficial y la de precios el ${FECHA} buscando «${etq.get(p.cap)}»; ninguna de las dos la nombra. No se consultaron otras páginas suyas.`});
 }
}
writeFileSync("registros-nuevos.json",JSON.stringify(nuevos,null,1));
const c={};for(const r of nuevos)c[r.estado]=(c[r.estado]||0)+1;
console.log("construidos "+nuevos.length+" "+JSON.stringify(c)+(descartados.length?"\n  fuera: "+descartados.join(", "):""));
const pr={};for(const r of nuevos.filter(x=>x.estado==="verificado"))pr[r.profundidad]=(pr[r.profundidad]||0)+1;
console.log("profundidad: "+JSON.stringify(pr));
