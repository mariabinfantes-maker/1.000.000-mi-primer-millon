#!/bin/bash
# Uso: ./pasada.sh <id> <nombre> <url1> <url2> <A|B>
ID="$1"; NOMBRE="$2"; U1="$3"; U2="$4"; P="$5"
if [ "$P" = "A" ]; then
CAMPOS='"idioma_es":"si|no_consta","espana":"si|no_consta","tipo_producto":"software|marketplace|combinacion|no_consta","precio":{"v":"si|no_consta","cita":""},"reserva_online_cliente":{"v":"si|no_consta","cita":""},"recordatorios_automaticos":{"v":"si|no_consta","cita":""},"cancelar_o_cambiar_cita":{"v":"si|no_consta","cita":""},"ficha_de_cliente":{"v":"si|no_consta","cita":""},"catalogo_de_servicios":{"v":"si|no_consta","cita":""}'
else
CAMPOS='"agenda_por_profesional":{"v":"si|no_consta","cita":""},"cobro_online":{"v":"si|no_consta","cita":""},"tpv_mostrador":{"v":"si|no_consta","cita":""},"senal_o_politica_ausencias":{"v":"si|no_consta","cita":""},"bonos_packs_sesiones":{"v":"si|no_consta","cita":""},"comisiones_o_propinas":{"v":"si|no_consta","cita":""},"widget_reserva_en_web_propia":{"v":"si|no_consta","cita":""},"inventario_stock":{"v":"si|no_consta","cita":""},"ficha_tecnica_servicio":{"v":"si|no_consta","cita":""}'
fi
PROMPT="Lee estas paginas oficiales de \"$NOMBRE\": $U1 y $U2
Si algo NO aparece literalmente, pon \"no_consta\". NUNCA digas que el producto no lo tiene. Cada \"si\" necesita una cita LITERAL de la pagina, 5-20 palabras. No infieras.
Devuelve SOLO este JSON: {$CAMPOS}"
jq -n --arg p "$PROMPT" '{contents:[{parts:[{text:$p}]}],tools:[{url_context:{}}],generationConfig:{temperature:0,maxOutputTokens:6000}}' > "q-$ID-$P.json"
for i in 1 2 3; do
  curl -sS --max-time 240 -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent" -H "Content-Type: application/json" -d @"q-$ID-$P.json" > "r-$ID-$P.json"
  [ "$(wc -c < "r-$ID-$P.json")" -gt 200 ] && break; sleep $((i*5))
done
rm -f "q-$ID-$P.json"
python3 - "$ID" "$P" <<'PY'
import json,sys,re
i,p=sys.argv[1],sys.argv[2]
try: d=json.load(open(f"r-{i}-{p}.json"))
except Exception: print(f"  {i}-{p}: corte del proxy"); sys.exit(0)
if "error" in d: print(f"  {i}-{p}: ERROR {d['error'].get('code')}"); sys.exit(0)
c=d["candidates"][0]
urls=[(m.get("retrievedUrl",""),m.get("urlRetrievalStatus","")) for m in c.get("urlContextMetadata",{}).get("urlMetadata",[])]
ok=sum(1 for _,s in urls if s=="URL_RETRIEVAL_STATUS_SUCCESS")
txt="".join(x.get("text","") for x in c.get("content",{}).get("parts",[]))
m=re.search(r"\{[\s\S]*\}",txt)
if not m: print(f"  {i}-{p}: sin JSON ({c.get('finishReason')}) urls {ok}/{len(urls)}"); sys.exit(0)
try: j=json.loads(m.group(0))
except Exception: print(f"  {i}-{p}: JSON roto, urls {ok}/{len(urls)}"); sys.exit(0)
json.dump({"urls":urls,"datos":j},open(f"ok-{i}-{p}.json","w"),ensure_ascii=False,indent=1)
si=sum(1 for k,v in j.items() if isinstance(v,dict) and v.get("v")=="si")
print(f"  {i}-{p}: urls {ok}/{len(urls)} · si={si}")
PY
