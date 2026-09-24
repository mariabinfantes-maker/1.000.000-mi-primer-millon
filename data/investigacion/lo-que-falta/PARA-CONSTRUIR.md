# A quién no podemos servir, y qué le falta exactamente

**24 de septiembre de 2026.** Encargo de la propietaria: *«dime qué necesita
una clínica o qué necesitan esas personas a las que no les podemos servir, y
yo desarrollaré un sistema propio de Molnip para ellos. De momento
continuaremos con lo que tenemos»*.

Esto no es una lista de deseos. Cada línea sale de **1.040 comprobaciones**
sobre las 65 herramientas del catálogo, leyendo su página oficial y su tarifa.
Donde pone «la demuestran 0» quiere decir que se preguntó y no apareció.

## A quién servimos hoy

| | Oficio |
|---|---|
| ✓ | Agencia de marketing y consultoría |
| ✓ | Diseño, foto y vídeo por cuenta propia |
| ✓ | Reformas y construcción |
| ✓ | Asesoría, gestoría y despacho |
| ✓ | Taller mecánico |

Todos comparten una forma de trabajar: **por proyectos y por clientes**. Es
para lo que está hecho el catálogo, y no es casualidad que sean negocios con
presupuesto.

## Lo que habría que construir, por cuántos oficios desbloquea

### 1 · Agenda por profesional o recurso — desbloquea 4 oficios

*Peluquería, fontanería e instalación, academia, entrenamiento personal.*

> Agenda separada por profesional, sala, sillón o máquina, con sus horarios y
> sus servicios.
>
> **No es** la agenda personal de quien trabaja, ni reservar recursos internos
> entre compañeros.

Preguntada a **65 de 65**. La demuestran **0**.

Es la pieza que más gente desbloquea y la que más se confunde: nueve
herramientas tienen «coge hora conmigo», que es una sola agenda. Lo que falta
es que la clienta elija **con quién** y que cada profesional tenga la suya.

### 2 · TPV y caja — desbloquea 3 oficios

*Peluquería, restaurante y bar, tienda y comercio minorista.*

> Cobrar en mostrador, con caja, tiques y cierre diario.
>
> **No es** la tienda en línea, ni cobrar una factura a distancia.

Preguntada a **65 de 65**. La demuestran **0**.

### 3 · Historia clínica — clínicas

> Guardar la historia clínica del paciente: antecedentes, evolución,
> tratamientos, con acceso restringido y conservación legal.
>
> **No es** el historial comercial ni un expediente genérico. El odontograma
> es una vista de ésta, no otra capacidad.

Preguntada a 2 de 65. La demuestran **0**. Y no va a aparecer: son datos de
salud, con ley encima, y ningún CRM los va a tocar.

### 4 · Cumplimiento del RGPD — clínicas

> Registro de tratamientos, gestión de derechos del interesado, contrato de
> encargado, consentimientos.
>
> **No dice dónde se alojan los datos**: eso es una restricción aparte y no se
> deduce de tratar datos sensibles.

Preguntada a **0 de 65**. Es la única de toda esta lista que nadie ha mirado
nunca, y va emparejada con la anterior: una clínica necesita las dos.

### 5 · Contratos vivos: vencimientos y renovaciones — inmobiliaria

> Saber qué contratos hay vivos, cuándo vencen, cuándo hay que preavisar y
> cómo se renuevan.
>
> **No es** firmarlos. Empieza donde la firma termina.

Preguntada a 9 de 65. La demuestran **0**.

### 6 · Liquidar a propietarios y colaboradores — inmobiliaria

> Cobrar en nombre de otro y liquidarle lo suyo menos la comisión:
> propietarios, colaboradores, artistas.
>
> **No es** facturar a un tercero pagador, donde el dinero viene hacia ti.
> Aquí el dinero sale hacia otro.

Preguntada a 7 de 65. La demuestran **0**.

### 7 · Activos propios y mantenimiento preventivo — transporte y reparto

> Inventario de los activos propios —máquinas, instalaciones, vehículos— y su
> mantenimiento preventivo y correctivo.
>
> **No es** el bien del cliente al que se da servicio. Estos son tuyos.

Preguntada a **65 de 65**. La demuestran **0**.

### 8 · Órdenes de fabricación — obrador y taller artesano

> Lanzar y seguir órdenes de fabricación: qué se produce, con qué, cuándo y en
> qué estado va.
>
> **No es** una orden de trabajo, que repara un bien de un cliente. Aquí se
> transforma material en producto.

Preguntada a 7 de 65. La demuestran **0**.

## Si hubiera que elegir una

**La agenda por profesional.** Desbloquea cuatro oficios, es la más pedida en
la vida real y es la que el catálogo tiene más cerca sin llegar: nueve
herramientas hacen «coge hora conmigo» y ninguna da el paso de separar la
agenda por persona.

Las dos de clínica van juntas o no van: una clínica sin RGPD no puede abrir.

## Lo que NO hace falta construir

Para los cinco oficios que ya servimos, no falta nada. Y a los que no
servimos, **la parte de facturar, cobrar y llevar clientes sí se la
cubrimos**: lo que no podemos es hacernos cargo de su oficio entero.

Una clínica puede usar hoy nuestro catálogo para su facturación. Lo que no
encontrará aquí es dónde guardar la historia de sus pacientes.

## Los archivos

- `../gremios/nucleo.json` — qué es el núcleo de cada oficio y por qué.
- `../gremios/medicion.json` — la medición por oficio y necesidad.
- Las 1.040 comprobaciones están en `registros.json` y en la pasada del
  24-09 (`data/investigacion/casas/`), con su cita y su fecha.
