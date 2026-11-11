import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface NodoEstado {
  readonly id: string;
  readonly nombre: string;
  readonly x: number;
  readonly y: number;
  /** Estado final: se dibuja con doble borde. */
  readonly final?: boolean;
}

export interface Transicion {
  readonly de: string;
  readonly a: string;
  readonly etiqueta: string;
  /** Curvatura en píxeles; sirve para separar dos flechas entre los mismos estados. */
  readonly curva?: number;
}

interface FlechaDibujada {
  readonly d: string;
  readonly x: number;
  readonly y: number;
  readonly etiqueta: string;
  readonly activa: boolean;
}

const MITAD_ANCHO = 75;
const MITAD_ALTO = 22;

/**
 * Diagrama de estados dibujado en SVG: el estado actual se resalta y las
 * flechas que salen de él se pintan más fuertes (son las acciones posibles).
 */
@Component({
  selector: 'app-diagrama-estados',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.viewBox]="'0 0 ' + ancho() + ' ' + alto()"
      role="img"
      [attr.aria-label]="'Diagrama de estados. Estado actual: ' + nombreActual()"
      class="h-auto w-full"
    >
      <defs>
        <marker id="punta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#64748b" />
        </marker>
        <marker id="punta-activa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#047857" />
        </marker>
      </defs>

      @for (f of flechas(); track $index) {
        <path
          [attr.d]="f.d"
          fill="none"
          [attr.stroke]="f.activa ? '#047857' : '#94a3b8'"
          [attr.stroke-width]="f.activa ? 2.5 : 1.5"
          [attr.marker-end]="f.activa ? 'url(#punta-activa)' : 'url(#punta)'"
        />
        <text
          [attr.x]="f.x"
          [attr.y]="f.y"
          text-anchor="middle"
          font-size="12"
          [attr.fill]="f.activa ? '#065f46' : '#475569'"
          [attr.font-weight]="f.activa ? 700 : 400"
          paint-order="stroke"
          stroke="#f8fafc"
          stroke-width="4"
        >
          {{ f.etiqueta }}
        </text>
      }

      @for (n of nodos(); track n.id) {
        @if (n.final) {
          <rect
            [attr.x]="n.x - ancho2 - 4"
            [attr.y]="n.y - alto2 - 4"
            [attr.width]="ancho2 * 2 + 8"
            [attr.height]="alto2 * 2 + 8"
            rx="14"
            fill="none"
            [attr.stroke]="n.id === actual() ? '#047857' : '#94a3b8'"
          />
        }
        <rect
          [attr.x]="n.x - ancho2"
          [attr.y]="n.y - alto2"
          [attr.width]="ancho2 * 2"
          [attr.height]="alto2 * 2"
          rx="11"
          [attr.fill]="n.id === actual() ? '#047857' : '#ffffff'"
          [attr.stroke]="n.id === actual() ? '#047857' : '#94a3b8'"
          stroke-width="2"
        />
        <text
          [attr.x]="n.x"
          [attr.y]="n.y + 5"
          text-anchor="middle"
          font-size="14"
          font-weight="600"
          [attr.fill]="n.id === actual() ? '#ffffff' : '#0f172a'"
        >
          {{ n.nombre }}
        </text>
      }
    </svg>
  `,
})
export class DiagramaEstadosComponent {
  readonly nodos = input.required<readonly NodoEstado[]>();
  readonly transiciones = input.required<readonly Transicion[]>();
  readonly actual = input.required<string>();
  readonly ancho = input(870);
  readonly alto = input(200);

  protected readonly ancho2 = MITAD_ANCHO;
  protected readonly alto2 = MITAD_ALTO;

  protected readonly nombreActual = computed(
    () => this.nodos().find((n) => n.id === this.actual())?.nombre ?? '',
  );

  protected readonly flechas = computed<readonly FlechaDibujada[]>(() => {
    const porId = new Map(this.nodos().map((n) => [n.id, n]));
    return this.transiciones().flatMap((t) => {
      const origen = porId.get(t.de);
      const destino = porId.get(t.a);
      if (!origen || !destino) return [];
      const activa = t.de === this.actual();
      return [t.de === t.a ? this.bucle(origen, t.etiqueta, activa) : this.flecha(origen, destino, t, activa)];
    });
  });

  /** Flecha de un estado a otro, recta o curva, recortada en el borde de las cajas. */
  private flecha(o: NodoEstado, d: NodoEstado, t: Transicion, activa: boolean): FlechaDibujada {
    const curva = t.curva ?? 0;
    const mx = (o.x + d.x) / 2;
    const my = (o.y + d.y) / 2;
    const dx = d.x - o.x;
    const dy = d.y - o.y;
    const largo = Math.hypot(dx, dy) || 1;
    // Punto de control desplazado hacia un lado de la recta.
    const cx = mx + (-dy / largo) * curva * 2;
    const cy = my + (dx / largo) * curva * 2;
    const inicio = this.borde(o, cx, cy);
    const fin = this.borde(d, cx, cy);
    return {
      d: `M${inicio.x},${inicio.y} Q${cx},${cy} ${fin.x},${fin.y}`,
      x: 0.25 * inicio.x + 0.5 * cx + 0.25 * fin.x,
      y: 0.25 * inicio.y + 0.5 * cy + 0.25 * fin.y - (curva === 0 ? 7 : 3),
      etiqueta: t.etiqueta,
      activa,
    };
  }

  /** Flecha que sale de un estado y vuelve a él (por ejemplo, un pago rechazado). */
  private bucle(n: NodoEstado, etiqueta: string, activa: boolean): FlechaDibujada {
    const arriba = n.y - MITAD_ALTO;
    return {
      d: `M${n.x - 22},${arriba} C${n.x - 40},${arriba - 46} ${n.x + 40},${arriba - 46} ${n.x + 22},${arriba}`,
      x: n.x,
      y: arriba - 40,
      etiqueta,
      activa,
    };
  }

  /** Punto del borde de la caja `n` en la dirección del punto (px, py). */
  private borde(n: NodoEstado, px: number, py: number): { x: number; y: number } {
    const dx = px - n.x;
    const dy = py - n.y;
    const k = Math.min(MITAD_ANCHO / Math.abs(dx || 1e-6), MITAD_ALTO / Math.abs(dy || 1e-6));
    return { x: n.x + dx * k, y: n.y + dy * k };
  }
}
