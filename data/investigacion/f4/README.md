# Evidencia de investigación de F4 — vertical de belleza con citas

**Esto no es catálogo.** Léelo entero antes de usar nada de aquí.

Son las respuestas en crudo de la etapa 2 de F4: lo que se leyó de las páginas
oficiales de 15 candidatas de gestión de citas para peluquerías, barberías,
uñas y estética, los días **11 y 12 de septiembre de 2026**, con
`gemini-3.6-flash` y lectura de URL (`url_context`).

Se guarda aquí porque **costó dinero y horas conseguirlo, y no se puede
reproducir**: las páginas cambian, y las citas literales que hay en estos
ficheros son de ese día concreto. Vivía en el cuaderno temporal de una sesión;
un contenedor reciclado se lo habría llevado entero.

## Qué NO es

- **No son fichas de catálogo.** Ninguna herramienta de aquí está en
  `data/herramientas/`, y ninguna entra sin que la propietaria apruebe el
  conjunto (etapa 3 de F4).
- **No son registros verificados de F2.** No han pasado por
  `data/verificacion/`, no tienen la forma de `EvidenciaDeCapacidad` y el
  puerto de F3 no los lee. El motor no sabe que existen.
- **No son decisiones.** Aquí no hay ninguna herramienta aprobada, descartada
  ni ordenada. Las decisiones están en `ATLAS.md`.
- **No es una verificación funcional.** Es lo que la web del fabricante dice de
  sí misma, leído una vez.

## Las tres certezas, y por qué importan

Cada campo de cada respuesta está en uno de estos estados, y **no son
intercambiables**:

- **`si`** — se encontró una frase literal en la página que lo sostiene. La
  cita está en el propio fichero.
- **`no_consta`** — no se encontró. **No significa que la herramienta no lo
  haga**: significa que no se ha demostrado que lo haga.
- **«no disponible demostrado»** — una frase oficial diciendo expresamente que
  no lo hace. **En toda esta investigación no hay ni un solo caso.** Todo lo
  que no es `si` es `no_consta`.

Confundir los dos últimos es el error que costó semanas en F2 y el que obligó
a rehacer el filtro del Researcher en septiembre de 2026. Aquí no se confunden.

## Salvedades conocidas, sin las cuales estos datos engañan

Se documentan aquí porque están en la conversación y en `ATLAS.md`, pero no
dentro de los ficheros: **los ficheros se guardan tal cual salieron, sin
retocar.**

1. **Cinco citas capturadas no sostienen su campo.** En SimplyBook.me, ViDay,
   Turnito y Treatwell, el campo `comisiones_o_propinas` —que debería medir
   *comisión al empleado o propina al profesional*— capturó frases sobre **la
   comisión que el proveedor cobra al negocio**. Sólo **SolverMedia** lo
   demuestra de verdad («*Calcula las comisiones de cada empleado por ventas o
   por servicio*»). La quinta es `bonos_packs_sesiones` en SimplyBook.me, cuya
   cita habla de «membresías», que no es un bono de sesiones. **Esos cinco
   deben leerse como `no_consta`.**
2. **Bewe no es lo que parece.** Todas las URL de `bewe.io` redirigen a
   `bewe.ai`, que hoy presenta un agente de IA («Linda»), no el software de
   gestión. Lo que está documentado es el agente.
3. **flowww está en inglés.** Las páginas que se pudieron leer están en inglés
   con precios en dólares. Que la interfaz esté en español **no consta**.
4. **Turnito es de mercado latinoamericano.** La única página legible es
   `turnito.app/mx/`, con MercadoPago y voseo. Presencia en España: no consta.
5. **El precio de Fresha no consta.** El «es gratis» que aparece en una
   respuesta es de la app de la clienta final, no del software para el negocio.
6. **La afiliación no intervino en nada de la parte funcional**, y se
   investigó al final, sobre un conjunto ya elegido por compatibilidad.

## Qué hay

- **`indice.json`** — qué se leyó de cada herramienta, en qué fichero está y
  qué URL se recuperó de verdad. Sólo navegación: no saca conclusiones.
- **`respuestas/`** — 62 respuestas, tal cual salieron:
  - `ok-*` — pasada funcional de la etapa 2.
  - `falta-*` — recuperación acotada de lo que faltaba.
  - `com-*` — investigación comercial (programas de afiliación o referidos).
  - `idioma-*` — comprobación de si el producto está en español.
- **`candidatas.json`** — las 15 con sus URL de partida.
- **`arnes/`** — los scripts con los que se obtuvo. Se guardan porque el prompt
  literal **es parte de la evidencia**: sin él no se sabe qué se preguntó.
  Ninguno contiene credenciales; la clave la inyecta el proxy del entorno.

## Si algún día esto entra al catálogo

No se copia. Se vuelve a verificar por el camino de F2/F3, con su propio
registro en `data/verificacion/`, y pasa por la puerta de evidencia. Estos
ficheros son el punto de partida de esa verificación, nunca su sustituto.
