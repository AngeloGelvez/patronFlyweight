# Patrón Flyweight · Mapa de sillas de un estadio

Aplicación Angular (solo frontend) que muestra, con un caso de la vida real, el problema que resuelve el
patrón de diseño [Flyweight](https://refactoring.guru/es/design-patterns/flyweight) y mide la diferencia
antes y después de aplicarlo.

## El problema

Una boletería muestra el mapa de un estadio con hasta **100.000 sillas**. Cada silla pertenece a una de
**6 localidades** (Palco, VIP, Preferencial, Occidental, Oriental y General), y todas las sillas de una
localidad comparten el mismo precio, color, beneficios, términos y condiciones (~2 KB) e icono.

| Ruta       | Versión           | Qué guarda cada silla                                           |
| ---------- | ----------------- | --------------------------------------------------------------- |
| `/antes`   | ❌ Sin Flyweight  | Sus datos **y su propia copia** de la localidad y del icono     |
| `/despues` | ✅ Con Flyweight  | Solo sus datos y una **referencia** a la localidad compartida   |

## Resultados medidos (Chrome, pestaña recién cargada)

| Sillas  | Versión       | Crear objetos | Dibujar | Copias de localidad | Memoria estimada |
| ------- | ------------- | ------------- | ------- | ------------------- | ---------------- |
| 10.000  | Sin Flyweight | 1,1 s         | 218 ms  | 10.000              | 68 MB            |
| 10.000  | Con Flyweight | 5 ms          | 62 ms   | 6                   | 1 MB             |
| 50.000  | Sin Flyweight | 8,4 s         | 1,1 s   | 50.000              | 342 MB           |
| 50.000  | Con Flyweight | 25 ms         | 317 ms  | 6                   | 4,8 MB           |
| 100.000 | Sin Flyweight | 36 s          | 4–18 s  | 100.000             | 683 MB           |
| 100.000 | Con Flyweight | 33 ms         | 601 ms  | 6                   | 9,5 MB           |

Los tiempos varían según el equipo y la memoria ocupada; la app los mide en cada ejecución.

## Cómo se aplica el patrón

| Parte del patrón | Clase                                                             | Responsabilidad                                         |
| ---------------- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| Flyweight        | [`Localidad`](src/app/despues/localidad.ts)                        | Estado intrínseco compartido e inmutable (datos + icono) |
| Contexto         | [`Silla`](src/app/despues/silla.ts)                                | Estado extrínseco: sección, fila, número, posición, estado |
| Fábrica          | [`LocalidadFactory`](src/app/despues/localidad.factory.ts)         | Caché (`Map`) que devuelve siempre la misma instancia   |
| Cliente          | [`EstadioConFlyweight`](src/app/despues/estadio-con-flyweight.ts)  | Construye y dibuja el mapa                               |

La versión sin el patrón está en [`src/app/antes/`](src/app/antes/). Ambas implementan el mismo
contrato [`MapaDeSillas`](src/app/core/models/mapa-de-sillas.ts), así que la interfaz las dibuja y mide
exactamente igual.

## Medición

[`BenchmarkService`](src/app/core/services/benchmark.service.ts) ejecuta tres pasos (cargar datos, crear
objetos y dibujar el mapa). Cada uno se mide con `console.time` / `console.timeEnd`, que deja el registro
en la consola de DevTools, y con `performance.now()`, que entrega el número para mostrarlo en pantalla.
Los resultados se guardan en `sessionStorage` para comparar las dos rutas aunque se recargue la pestaña.

La **memoria estimada** se calcula a partir de los datos que guarda cada versión
([`memoria.ts`](src/app/core/utils/memoria.ts)). El heap de `performance.memory` solo existe en Chrome y
Edge y se muestra únicamente como referencia.

## Datos

No hay backend. La "base de datos" está en [`src/app/core/data/`](src/app/core/data/): las 6 localidades,
el evento y un generador de sillas con semilla fija, que produce siempre las mismas sillas para que la
comparación sea justa.

## Tecnologías

Angular 19 (componentes standalone, signals y rutas con carga diferida), Tailwind CSS 4 y Canvas 2D.

## Comandos

```bash
npm install
npm start        # http://localhost:4200
npm test         # pruebas unitarias (Karma + Jasmine)
npm run build    # build de producción en dist/
```
