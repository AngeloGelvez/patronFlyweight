# Patrón Flyweight · Venta de entradas del Estadio Metropolitano

Aplicación Angular (solo frontend) que simula la web de venta de entradas para el partido
**Real Madrid vs Atlético de Madrid** (LaLiga EA Sports) en el Estadio Metropolitano. La persona elige su
asiento en el mapa, ve **cómo se ve el campo desde esa zona**, escribe sus datos, paga (simulado) y recibe
su entrada. Por dentro, el sitio puede funcionar **sin** o **con** el patrón de diseño
[Flyweight](https://refactoring.guru/es/design-patterns/flyweight).

La explicación del patrón, el código antes y después y los resultados de rendimiento están en la
presentación del proyecto; la app solo muestra la funcionalidad.

> Sitio no oficial y sin relación con los clubes ni con el estadio. El partido, los precios y los
> asientos son ficticios y no se realizan compras ni cobros. Los escudos se cargan desde Wikimedia y la
> foto del estadio desde socios.com (no se guardan en el proyecto); las marcas pertenecen a sus
> propietarios.

## Cómo se usa

1. La **barra amarilla superior** es de la demostración: elige el patrón (**Flyweight** o
   **Bridge**) y, dentro de Flyweight, **Sin Flyweight** (`/patronFlyweight/antes`) o
   **Con Flyweight** (`/patronFlyweight/despues`) y el aforo (10.000 a 100.000 asientos). Cambiar de
   versión recarga la página para medir siempre con la memoria limpia; la compra en curso se conserva.
2. El resto es el sitio: **Elige tu asiento → Tus datos → Pago → Tu entrada**. Precios en euros,
   documento DNI/NIE/pasaporte y pago simulado con tarjeta, Bizum o PayPal.
3. Al seleccionar un asiento aparece la **vista previa** del campo desde su zona.
4. Los tiempos de cada paso quedan en la **consola del navegador** (F12).

## El problema

Cada asiento tiene datos propios (sección, fila, número, posición, estado) y datos que comparte con
muchos otros:

| Dato compartido                                   | Compartido por                           | Cantidad |
| ------------------------------------------------- | ---------------------------------------- | -------- |
| Precio, beneficios, ~2 KB de condiciones e icono  | Todos los asientos de una **localidad**  | 6        |
| Vista previa del campo (imagen de 800 × 450)      | Todos los asientos de una **zona**       | 7        |

| Versión           | Qué guarda cada asiento                                                               |
| ----------------- | ------------------------------------------------------------------------------------- |
| ❌ Sin Flyweight  | Su propia copia de la localidad, su propio icono y, al seleccionarlo, su propia vista |
| ✅ Con Flyweight  | Solo sus datos y referencias a la localidad y a la vista compartidas                   |

Las zonas con vista propia son Fondo Norte, Fondo Sur, Lateral Este, Lateral Oeste, Preferencia, VIP y
Palco. Cada vista se dibuja en 3D con Canvas (campo, líneas, porterías, gradas con los colores de cada
localidad, público y focos) sin usar imágenes externas.

## Resultados medidos (Chrome, página recién cargada)

| Asientos | Versión      | Crear objetos | Dibujar | Copias de localidad | Memoria estimada del mapa |
| ------- | ------------- | ------------- | ------- | ------------------- | ------------------------- |
| 10.000  | Sin Flyweight | 1,1 s         | 218 ms  | 10.000              | 68 MB                     |
| 10.000  | Con Flyweight | 5 ms          | 62 ms   | 6                   | 1 MB                      |
| 50.000  | Sin Flyweight | 8,4 s         | 1,1 s   | 50.000              | 342 MB                    |
| 50.000  | Con Flyweight | 25 ms         | 317 ms  | 6                   | 4,8 MB                    |
| 100.000 | Sin Flyweight | 36 s          | 4–18 s  | 100.000             | 683 MB                    |
| 100.000 | Con Flyweight | 33 ms         | 601 ms  | 6                   | 9,5 MB                    |

Vistas previas al seleccionar 4 asientos VIP:

| Versión       | Vistas dibujadas | Tiempo por vista               | Memoria de vistas |
| ------------- | ---------------- | ------------------------------ | ----------------- |
| Sin Flyweight | 4                | 15–30 ms cada una              | 5,5 MB            |
| Con Flyweight | 1                | 42 ms la primera, 0 ms después | 1,4 MB            |

Los tiempos varían según el equipo; la app los mide en cada carga.

## Cómo se aplica el patrón

| Parte del patrón | Clase                                                                                                        | Responsabilidad                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Flyweight        | [`Localidad`](src/app/despues/localidad.ts) y la vista de cada zona                                           | Estado intrínseco compartido e inmutable                   |
| Contexto         | [`Silla`](src/app/despues/silla.ts)                                                                           | Estado extrínseco: zona, sección, fila, número, posición, estado |
| Fábricas         | [`LocalidadFactory`](src/app/despues/localidad.factory.ts), [`VistaPreviaFactory`](src/app/despues/vista-previa.factory.ts) | Caché (`Map`) que devuelve siempre la misma instancia      |
| Cliente          | [`EstadioConFlyweight`](src/app/despues/estadio-con-flyweight.ts)                                             | Construye el mapa y entrega las vistas                     |

La versión sin el patrón está en [`src/app/antes/`](src/app/antes/). Ambas implementan el mismo contrato
[`MapaDeSillas`](src/app/core/models/mapa-de-sillas.ts), así que el sitio las usa y mide exactamente igual.

## Medición

[`BenchmarkService`](src/app/core/services/benchmark.service.ts) mide la carga del mapa en tres pasos (leer
datos, crear objetos y dibujar) y cada vista previa. Cada medición usa `console.time` / `console.timeEnd`,
que deja el registro en la consola de DevTools, y `performance.now()`, que entrega el número para guardarlo.
Los resultados, el aforo y la compra en curso se guardan en `sessionStorage`.

La **memoria estimada** se calcula a partir de los datos que guarda cada versión
([`memoria.ts`](src/app/core/utils/memoria.ts)): textos, números y píxeles de iconos y vistas.

## Datos

No hay backend. La "base de datos" está en [`src/app/core/data/`](src/app/core/data/): localidades, zonas,
evento y un generador de sillas con semilla fija, que produce siempre las mismas sillas para que la
comparación sea justa.

## Segunda demostración · Patrón Bridge (`/patronBridge`)

Independiente de la anterior y en su propia carpeta, [`src/app/bridge/`](src/app/bridge/). Aquí el
estadio tiene solo **500 asientos**: [Bridge](https://refactoring.guru/es/design-patterns/bridge) no
es un patrón de optimización, así que no hace falta un aforo grande.

Separa **qué se dibuja** de **con qué se dibuja**, en dos jerarquías unidas por composición:

| Abstracción · el qué | Implementación · el con qué |
| --- | --- |
| [`MapaDeAsientos`](src/app/bridge/vistas/mapa-de-asientos.ts) | [`DibujanteCanvas`](src/app/bridge/dibujantes/dibujante-canvas.ts) — rápido, se pixela al ampliar |
| [`VistaDesdeElAsiento`](src/app/bridge/vistas/vista-desde-el-asiento.ts) | [`DibujanteSvg`](src/app/bridge/dibujantes/dibujante-svg.ts) — vectorial, imprime nítido |
| [`EntradaImprimible`](src/app/bridge/vistas/entrada-imprimible.ts) | [`DibujanteTexto`](src/app/bridge/dibujantes/dibujante-texto.ts) — describe la escena con palabras |

El puente está en [`VistaDelEstadio`](src/app/bridge/vistas/vista-del-estadio.ts): **guarda** un
`Dibujante` en un atributo en vez de heredar de él. Por eso las dos jerarquías crecen por separado:
**3 vistas + 3 motores = 6 clases que dan 9 combinaciones**, y añadir un motor nuevo es una sola
clase en vez de tres. La página deja elegir cualquiera de las 9 y dibuja el resultado.

## Tecnologías

Angular 19 (componentes standalone, signals, formularios reactivos y rutas con carga diferida),
Tailwind CSS 4, Canvas 2D y SVG.

## Comandos

```bash
npm install
npm start        # http://localhost:4200
npm test         # pruebas unitarias (Karma + Jasmine)
npm run build    # build de producción en dist/
```
