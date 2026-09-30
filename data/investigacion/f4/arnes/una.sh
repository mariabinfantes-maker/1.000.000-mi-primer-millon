#!/bin/bash
# Uso: ./una.sh <id> <etiqueta> <nombre> <url>   -- UNA sola URL por llamada
ID="$1"; ET="$2"; NOMBRE="$3"; U="$4"
PROMPT="Lee esta pagina oficial de \"$NOMBRE\": $U
Reglas: si algo NO aparece literalmente en ESA pagina, pon \"no_consta\". NUNCA digas que el producto no lo tiene. Cada \"si\" lleva una cita LITERAL de la pagina, 5-20 palabras. No infieras ni uses conocimiento previo.
Devuelve SOLO este JSON:
{\"idioma_es\":\"si|no_consta\",\"espana\":\"si|no_consta\",\"tipo_producto\":\"software|marketplace|combinacion|no_consta\",\"precio\":{\"v\":\"si|no_consta\",\"cita\":\"\"},\"reserva_online_cliente\":{\"v\":\"si|no_consta\",\"cita\":\"\"},\"recordatorios_automaticos\":{\"v\":\"si|no_consta\",\"cita\":\"\"},\"cancelar_o_cambiar_cita\":{\"v\":\"si|no_consta\",\"cita\":\"\"},\"ficha_de_cliente\":{\"v\":\"si|no_consta\",\"cita\":\"\"},\"catalogo_de_servicios\":{\"v\":\"si|no_consta\",\"cita\":\"\"},\"agenda_por_profesional\":{\"v\":\"si|no_consta\",\"cita\":\"\"},\"cobro_online\":{\"v\":\"si|no_consta\",\"cita\":\"\"},\"tpv_mostrador\":{\"v\":\"si|no_consta\",\"cita\":\"\"},\"senal_o_politica_ausencias\":{\"v\":\"si|no_consta\",\"cita\":\"\"},\"bonos_packs_sesiones\":{\"v\":\"si|no_consta\",\"cita\":\"\"},\"comisiones_o_propinas\":{\"v\":\"si|no_consta\",\"cita\":\"\"},\"widget_reserva_en_web_propia\":{\"v\":\"si|no_consta\",\"cita\":\"\"},\"inventario_stock\":{\"v\":\"si|no_consta\",\"cita\":\"\"},\"ficha_tecnica_servicio\":{\"v\":\"si|no_consta\",\"cita\":\"\"}}"
jq -n --arg p "$PROMPT" '{contents:[{parts:[{text:$p}]}],tools:[{url_context:{}}],generationConfig:{temperature:0,maxOutputTokens:8000,thinkingConfig:{thinkingBudget:1024}}}' > "q-$ID-$ET.json"
for i in 1 2 3; do
  curl -sS --max-time 240 -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent" -H "Content-Type: application/json" -d @"q-$ID-$ET.json" > "r-$ID-$ET.json"
  [ "$(wc -c < "r-$ID-$ET.json")" -gt 200 ] && break; sleep $((i*5))
done
rm -f "q-$ID-$ET.json"
python3 - "$ID" "$ET" "$U" <<'PY'
import json,sys,re
i,e,u=sys.argv[1],sys.argv[2],sys.argv[3]
try: d=json.load(open(f"r-{i}-{e}.json"))
except Exception: print(f"  {i}/{e}: CORTE"); sys.exit(0)
if "error" in d: print(f"  {i}/{e}: ERROR {d['error'].get('code')} {d['error'].get('message','')[:60]}"); sys.exit(0)
c=d["candidates"][0]
urls=[(m.get("retrievedUrl",""),m.get("urlRetrievalStatus","")) for m in c.get("urlContextMetadata",{}).get("urlMetadata",[])]
ok=[r for r,s in urls if s=="URL_RETRIEVAL_STATUS_SUCCESS"]
txt="".join(x.get("text","") for x in c.get("content",{}).get("parts",[]))
m=re.search(r"\{[\s\S]*\}",txt)
if not m: print(f"  {i}/{e}: sin JSON ({c.get('finishReason')}) leidas {len(ok)}/{len(urls)}"); sys.exit(0)
try: j=json.loads(m.group(0))
except Exception: print(f"  {i}/{e}: JSON roto"); sys.exit(0)
json.dump({"pedida":u,"urls":urls,"datos":j},open(f"ok-{i}-{e}.json","w"),ensure_ascii=False,indent=1)
si=sum(1 for k,v in j.items() if isinstance(v,dict) and v.get("v")=="si")
red=" REDIR" if ok and ok[0].rstrip('/')!=u.rstrip('/') else ""
print(f"  {i}/{e}: leidas {len(ok)}/{len(urls)}{red} · si={si}/14")
PY
