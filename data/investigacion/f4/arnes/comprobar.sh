#!/bin/bash
# Comprueba una candidata contra sus páginas oficiales con Gemini + url_context.
# Uso: ./comprobar.sh <id> <nombre> <url1> <url2>
ID="$1"; NOMBRE="$2"; U1="$3"; U2="$4"
PROMPT=$(cat <<EOF
Eres un verificador. Lee ÚNICAMENTE estas páginas oficiales de "$NOMBRE" y responde sobre lo que digan:
- $U1
- $U2

Reglas estrictas:
- Si algo NO aparece literalmente en las páginas, responde "no_consta". NUNCA respondas que el producto no lo tiene.
- Para cada "si" debes dar una cita LITERAL copiada de la página, en su idioma original, de 5 a 25 palabras.
- No infieras, no completes con conocimiento previo, no supongas.

Devuelve SOLO este JSON, sin markdown:
{
 "idioma_es": "si|no_consta",
 "espana": "si|no_consta",
 "tipo_producto": "software|marketplace|combinacion|no_consta",
 "precio": {"v":"si|no_consta","cita":""},
 "capacidades": {
  "reserva_online_cliente": {"v":"si|no_consta","cita":""},
  "recordatorios_automaticos": {"v":"si|no_consta","cita":""},
  "cancelar_o_cambiar_cita": {"v":"si|no_consta","cita":""},
  "ficha_de_cliente": {"v":"si|no_consta","cita":""},
  "catalogo_de_servicios": {"v":"si|no_consta","cita":""},
  "agenda_por_profesional": {"v":"si|no_consta","cita":""},
  "cobro_online": {"v":"si|no_consta","cita":""},
  "tpv_mostrador": {"v":"si|no_consta","cita":""},
  "senal_o_politica_ausencias": {"v":"si|no_consta","cita":""},
  "bonos_packs_sesiones": {"v":"si|no_consta","cita":""},
  "comisiones_o_propinas": {"v":"si|no_consta","cita":""},
  "widget_reserva_en_web_propia": {"v":"si|no_consta","cita":""},
  "inventario_stock": {"v":"si|no_consta","cita":""}
 },
 "ficha_tecnica_servicio": {"v":"si|no_consta","cita":""}
}
EOF
)
jq -n --arg p "$PROMPT" '{contents:[{parts:[{text:$p}]}],tools:[{url_context:{}}],generationConfig:{temperature:0,maxOutputTokens:20000}}' > "req-$ID.json"
for intento in 1 2 3; do
  curl -sS --max-time 240 -X POST \
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent" \
    -H "Content-Type: application/json" -d @"req-$ID.json" > "raw-$ID.json"
  if [ "$(wc -c < "raw-$ID.json")" -gt 200 ]; then break; fi
  sleep $((intento * 4))
done
rm -f "req-$ID.json"
python3 - "$ID" <<'PY'
import json,sys,re
i=sys.argv[1]
d=json.load(open(f"raw-{i}.json"))
if "error" in d:
    print(f"{i}: ERROR {d['error'].get('code')} {d['error'].get('message','')[:90]}"); sys.exit(0)
c=d["candidates"][0]
urls=[(m.get("retrievedUrl",""),m.get("urlRetrievalStatus","")) for m in c.get("urlContextMetadata",{}).get("urlMetadata",[])]
ok=sum(1 for _,s in urls if s=="URL_RETRIEVAL_STATUS_SUCCESS")
txt="".join(p.get("text","") for p in c["content"]["parts"])
m=re.search(r"\{[\s\S]*\}",txt)
if not m: print(f"{i}: sin JSON | urls {ok}/{len(urls)}"); sys.exit(0)
try: j=json.loads(m.group(0))
except Exception as e: print(f"{i}: JSON inválido {e} | urls {ok}/{len(urls)}"); sys.exit(0)
json.dump({"id":i,"urls":urls,"datos":j}, open(f"ok-{i}.json","w"), ensure_ascii=False, indent=1)
caps=j.get("capacidades",{})
si=[k for k,v in caps.items() if v.get("v")=="si"]
print(f"{i}: urls {ok}/{len(urls)} | es={j.get('idioma_es')} tipo={j.get('tipo_producto')} | caps si={len(si)}/13")
PY
