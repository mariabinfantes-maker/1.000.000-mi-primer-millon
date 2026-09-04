<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# La marca de Molnip

El color principal es **`#6E5FE4`**. Está **congelado**: no se cambia sin
aprobación explícita de la propietaria, y hay una prueba que falla si cambia.

Antes de tocar cualquier color, lee **`brand-guidelines.md`**. Los colores son
tokens de `app/globals.css` (y `lib/marca/paleta.ts` para lo que no puede leer
CSS). **No escribas ningún color a mano en una página o componente**: hay
pruebas que lo impiden, y existen porque la portada ya se quedó semanas con un
índigo viejo por escribirlo como texto en vez de usar el token.

# La visión de Molnip

Manda sobre todo lo demás. Está completa en `ATLAS.md`, sección «La visión de
Molnip»; esto es lo mínimo para no proponer algo que la contradiga.

**Molnip no es un directorio ni un comparador: es un asesor tecnológico
cercano.** Tiene que ayudar igual a una autónoma que sólo sabe describir su
problema —«soy peluquera y pierdo citas»— que a una empresa que sabe
exactamente qué busca. **La carga de entender es de Molnip, no de la persona.**

Cuatro reglas que se derivan y que no se negocian:

- **Decir que no es un resultado válido.** Si no se entiende la necesidad, o el
  catálogo no la cubre, se dice. **Tres recomendaciones es la consecuencia de
  que haya tres buenas, nunca un objetivo que rellenar.**
- **Primero que sirva, después que encaje.** La compatibilidad funcional
  verificada va antes que el orden por tamaño, precio, idioma o facilidad.
- **La afiliación nunca altera el resultado.**
- **Sin lenguaje técnico.** Si la explicación sólo la entiende quien ya sabía,
  no ha servido.

**El catálogo está vivo.** Las 62 herramientas son la base que verifica F2, no
un tope. Si el catálogo no cubre una necesidad, Researcher busca alternativas
**con o sin afiliación**.

Una herramienta sin programa **no se descarta sola, pero tampoco se eleva por
ser buena**: se presenta a la propietaria sólo si cubre una necesidad que el
catálogo afiliado no cubre, o si demuestra con evidencia comparable una ventaja
material para el cliente. **La fama, el tamaño, el marketing o tener más
funciones no son esa ventaja.** Si una alternativa afiliada cubre la necesidad
igual de bien, se mantiene la regla habitual. **Decide la propietaria.**

La afiliación sigue siendo la vía habitual, pero nunca convierte lo incompatible
en recomendable. Política provisional completa en `ATLAS.md`.

Sólida, premium y con la escala de una gran tecnológica, pero humana y cercana.
Sencilla para quien empieza, profunda para quien sabe más.

# La memoria de Molnip

Este proyecto lleva meses en marcha y **su memoria no está en tu contexto: está
escrita**. Léela antes de proponer nada — lo que no leas, lo repetirás.

- **`ATLAS.md`** — 3.000 líneas en orden cronológico: decisiones, incidentes y
  por qué cada cosa es como es. Lo más reciente va al final, justo antes del
  bloque «MOLNIP VISUAL v1».
- **`ARQUITECTURA-AGENTES.md`** — referencia canónica de los agentes. Manda
  sobre la «Hoja de ruta» de ATLAS.md, que es registro histórico.
- **`data/vocabulario/CONDICIONES-PARA-F3.md`** — lo que hay que cerrar antes de
  conectar el vocabulario al motor.

Cinco cosas que no vas a adivinar y que ya están decididas:

1. **Son 11 agentes**, no los que tengan carpeta en `agents/`: tres están sin
   diseñar. Y **«Atlas Evaluador» es el nombre antiguo de «Atlas Advisor»**, no
   un agente aparte. Contar carpetas da 8 y es una cuenta equivocada.
2. **Las 62 fichas del catálogo no se verificaron contra fuentes primarias**,
   aunque sí pasaron una validación estructural exigente: puntuación mínima,
   duplicados, afiliación, campos completos y aprobación de la propietaria. Se
   generaron con un modelo sin navegación y las fuentes no se guardaron. El
   filtro medía calidad, no veracidad.
3. **El vocabulario de capacidades (F1) está en producción y no lo lee nadie
   todavía**, a propósito. Conectarlo al motor es F3 y tiene condiciones previas.
4. **Nada se fusiona ni se despliega sin autorización explícita de la
   propietaria**, y no se abren sprints por iniciativa propia.
5. **«Atlas» es el nombre técnico interno; «Molnip» es la marca pública.** Por
   eso el código dice `atlas-advisor` y la web dice Molnip.
