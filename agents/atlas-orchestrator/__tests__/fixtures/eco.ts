/**
 * Fixture de prueba del ejecutor. No es una tarea del catálogo y nunca lo
 * será: existe para que una prueba lance un proceso de verdad —el mismo
 * camino que usan las tareas reales— y pueda comprobar qué le llegó.
 *
 * Imprime sus argumentos tal cual los recibe. Si el primero es "fallo",
 * sale con código 1, para probar el camino del error.
 */
const argumentos = process.argv.slice(2);
console.log(JSON.stringify(argumentos));
if (argumentos[0] === "fallo") process.exit(1);
