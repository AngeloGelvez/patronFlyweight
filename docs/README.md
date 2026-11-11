# Diagramas del patrón State

Los diagramas están en [`docs/diagramas/`](diagramas/). Cada uno existe en **SVG** (vectorial: se amplía
sin perder nitidez) y en **PNG** de alta resolución. En GitHub, **haz clic en la imagen** para verla en
grande y usa el zoom del navegador, o abre el archivo `.svg` directamente.

## Estructura general del patrón

[![Estructura del patrón State](diagramas/00-state-estructura.svg)](diagramas/00-state-estructura.svg)

| Participante       | Papel                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| Contexto           | Guarda el estado actual y le delega el trabajo                         |
| Estado             | Interfaz común: una operación por cada acción posible                  |
| Estados concretos  | Implementan su comportamiento y deciden a qué estado pasar             |

## Ejemplo 1 · Solo State: la entrada

Código: [`src/app/state-simple/`](../src/app/state-simple/) · Ruta de la demo: `/patronState/simple`

### Diagrama de clases

[![Ejemplo 1 · Diagrama de clases](diagramas/01-ejemplo1-clases.svg)](diagramas/01-ejemplo1-clases.svg)

### Diagrama de estados

[![Ejemplo 1 · Diagrama de estados](diagramas/02-ejemplo1-estados.svg)](diagramas/02-ejemplo1-estados.svg)

| Estado     | reservar     | pagar    | cancelar                    | entrar              |
| ---------- | ------------ | -------- | --------------------------- | ------------------- |
| Disponible | → Reservada  | rechaza  | rechaza                     | rechaza             |
| Reservada  | rechaza      | → Pagada | → Disponible                | rechaza             |
| Pagada     | rechaza      | rechaza  | rechaza (sin devoluciones)  | → Usada             |
| Usada      | rechaza      | rechaza  | rechaza                     | rechaza (ya se usó) |

## Ejemplo 2 · State + Observer: el pedido

Código: [`src/app/state-observer/`](../src/app/state-observer/) · Ruta de la demo: `/patronState/observer`

### Diagrama de clases

[![Ejemplo 2 · Diagrama de clases](diagramas/03-ejemplo2-clases.svg)](diagramas/03-ejemplo2-clases.svg)

### Diagrama de estados

[![Ejemplo 2 · Diagrama de estados](diagramas/04-ejemplo2-estados.svg)](diagramas/04-ejemplo2-estados.svg)

## Versión Mermaid (editable)

GitHub dibuja Mermaid directamente y permite ampliar y mover el diagrama. Las fuentes de los diagramas de estados son los
archivos `.mmd` de [`diagramas/`](diagramas/).

<details>
<summary>Ejemplo 1 · clases (Mermaid)</summary>

```mermaid
classDiagram
    direction TB
    class Entrada {
        <<Contexto>>
        -estado: EstadoEntrada
        +reservar() Resultado
        +pagar() Resultado
        +cancelar() Resultado
        +entrar() Resultado
        +cambiarEstado(nuevo)
    }
    class EstadoEntrada {
        <<abstract>>
        +reservar(entrada) Resultado
        +pagar(entrada) Resultado
        +cancelar(entrada) Resultado
        +entrar(entrada) Resultado
        #rechazar(accion) Resultado
    }
    Entrada o--> EstadoEntrada : estado actual
    EstadoEntrada <|-- Disponible
    EstadoEntrada <|-- Reservada
    EstadoEntrada <|-- Pagada
    EstadoEntrada <|-- Usada
    Disponible ..> Reservada : reservar
    Reservada ..> Pagada : pagar
    Reservada ..> Disponible : cancelar
    Pagada ..> Usada : entrar
```

</details>

<details>
<summary>Ejemplo 1 · estados (Mermaid)</summary>

```mermaid
stateDiagram-v2
    direction LR
    [*] --> Disponible
    Disponible --> Reservada : reservar
    Reservada --> Disponible : cancelar
    Reservada --> Pagada : pagar
    Pagada --> Usada : entrar
    Usada --> [*]
```

</details>

<details>
<summary>Ejemplo 2 · estados (Mermaid)</summary>

```mermaid
stateDiagram-v2
    direction LR
    [*] --> EnCarrito
    EnCarrito --> PendienteDePago : confirmar
    EnCarrito --> Cancelado : cancelar
    PendienteDePago --> PendienteDePago : pago rechazado (1.º y 2.º)
    PendienteDePago --> Pagado : pagar
    PendienteDePago --> Cancelado : cancelar / expirar / 3.er rechazo
    Pagado --> Reembolsado : reembolsar (≥ 7 días)
    Cancelado --> [*]
    Reembolsado --> [*]
```

</details>
