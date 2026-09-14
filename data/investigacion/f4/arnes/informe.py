import json, glob, os, datetime
CAND={c["id"]:c["nombre"] for c in json.load(open("candidatas.json"))}
ESEN=[("reserva_online_cliente","reserva online"),("recordatorios_automaticos","recordatorios"),
      ("cancelar_o_cambiar_cita","cancelar/cambiar"),("ficha_de_cliente","ficha cliente"),
      ("catalogo_de_servicios","catálogo servicios")]
COND=[("agenda_por_profesional","agenda x prof."),("cobro_online","cobro online"),("tpv_mostrador","TPV"),
      ("senal_o_politica_ausencias","señal/ausencias"),("bonos_packs_sesiones","bonos"),
      ("comisiones_o_propinas","comisiones"),("widget_reserva_en_web_propia","widget web"),
      ("inventario_stock","inventario")]
res={}
for f in sorted(glob.glob("ok-*.json")):
    cid,et=os.path.basename(f)[3:-5].rsplit("-",1)
    d=json.load(open(f)); j=d["datos"]
    r=res.setdefault(cid,{"campos":{},"citas":{},"meta":{},"paginas":[]})
    leidas=[u for u,s in d["urls"] if s=="URL_RETRIEVAL_STATUS_SUCCESS"]
    r["paginas"].append({"etiqueta":et,"pedida":d["pedida"],"leidas":leidas})
    for k in ("idioma_es","espana","tipo_producto"):
        v=j.get(k)
        if v and v!="no_consta": r["meta"].setdefault(k,v)
    for k,_ in ESEN+COND+[("precio",""),("ficha_tecnica_servicio","")]:
        v=j.get(k)
        if isinstance(v,dict) and v.get("v")=="si" and k not in r["campos"]:
            r["campos"][k]="si"; r["citas"][k]=(et, leidas[0] if leidas else d["pedida"], (v.get("cita") or "").strip())
res["_fecha"]=datetime.date.today().isoformat()
json.dump(res,open("informe.json","w"),ensure_ascii=False,indent=1)

def mk(cid,k): return "sí" if res[cid]["campos"].get(k)=="si" else "·"
print(f"FECHA DE CONSULTA: {res['_fecha']}\n")
print("CANDIDATA        es  tipo         " + " ".join(n[:4].rjust(4) for _,n in ESEN) + " |" + " ".join(n[:4].rjust(4) for _,n in COND) + "  pág")
for cid,nom in CAND.items():
    if cid not in res: print(f"{nom:<16} — sin datos"); continue
    r=res[cid]; ok=sum(1 for p in r["paginas"] if p["leidas"])
    e=" ".join(mk(cid,k).rjust(4) for k,_ in ESEN); c=" ".join(mk(cid,k).rjust(4) for k,_ in COND)
    print(f"{nom:<16} {r['meta'].get('idioma_es','?'):<3} {r['meta'].get('tipo_producto','no_consta'):<12} {e} |{c}  {ok}/{len(r['paginas'])}")
