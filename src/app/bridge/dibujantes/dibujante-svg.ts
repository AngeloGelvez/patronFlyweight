import { Dibujante, Estilo, EstiloTexto, ResultadoDibujo } from '../dibujante';

/**
 * IMPLEMENTACIÓN CONCRETA · SVG.
 *
 * En lugar de pintar píxeles, va acumulando etiquetas de texto y al terminar
 * entrega el marcado completo. La imagen es vectorial: se amplía sin perder
 * nitidez, imprime bien y cada figura puede llevar su propio texto
 * alternativo con `<title>`.
 */
export class DibujanteSvg implements Dibujante {
  readonly id = 'svg' as const;
  readonly nombre = 'SVG';

  private ancho = 0;
  private alto = 0;
  private figuras: string[] = [];

  iniciar(ancho: number, alto: number): void {
    this.ancho = ancho;
    this.alto = alto;
    this.figuras = [];
  }

  rectangulo(x: number, y: number, ancho: number, alto: number, estilo: Estilo = {}): void {
    const esquinas = estilo.radio ? ` rx="${n(estilo.radio)}"` : '';
    this.figura(
      'rect',
      `x="${n(x)}" y="${n(y)}" width="${n(ancho)}" height="${n(alto)}"${esquinas}${this.pintura(estilo)}`,
      estilo,
    );
  }

  circulo(x: number, y: number, radio: number, estilo: Estilo = {}): void {
    this.figura('circle', `cx="${n(x)}" cy="${n(y)}" r="${n(radio)}"${this.pintura(estilo)}`, estilo);
  }

  linea(x1: number, y1: number, x2: number, y2: number, estilo: Estilo = {}): void {
    const trazo = ` stroke="${estilo.borde ?? '#000000'}" stroke-width="${estilo.grosor ?? 1}" stroke-linecap="round"`;
    this.figura('line', `x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"${trazo}`, estilo);
  }

  texto(x: number, y: number, contenido: string, estilo: EstiloTexto = {}): void {
    const atributos =
      `x="${n(x)}" y="${n(y)}" fill="${estilo.color ?? '#0f172a'}"` +
      ` font-size="${estilo.tamano ?? 16}" font-weight="${estilo.negrita ? '700' : '400'}"` +
      ` text-anchor="${ANCLA[estilo.alineacion ?? 'izquierda']}" dominant-baseline="middle"` +
      ` font-family="ui-sans-serif, system-ui, sans-serif"`;
    this.figuras.push(`<text ${atributos}>${escapar(contenido)}</text>`);
  }

  terminar(): ResultadoDibujo {
    const marcado =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.ancho} ${this.alto}" ` +
      `width="100%" role="img">\n${this.figuras.join('\n')}\n</svg>`;
    return { tipo: 'svg', marcado };
  }

  /** Una figura con `<title>` cuando lleva etiqueta, para los lectores de pantalla. */
  private figura(tag: string, atributos: string, estilo: Estilo): void {
    if (!estilo.etiqueta) {
      this.figuras.push(`<${tag} ${atributos} />`);
      return;
    }
    this.figuras.push(`<${tag} ${atributos}><title>${escapar(estilo.etiqueta)}</title></${tag}>`);
  }

  private pintura(estilo: Estilo): string {
    let atributos = ` fill="${estilo.relleno ?? 'none'}"`;
    if (estilo.borde) atributos += ` stroke="${estilo.borde}" stroke-width="${estilo.grosor ?? 1}"`;
    if (estilo.opacidad !== undefined) atributos += ` opacity="${estilo.opacidad}"`;
    return atributos;
  }
}

const ANCLA: Record<NonNullable<EstiloTexto['alineacion']>, string> = {
  izquierda: 'start',
  centro: 'middle',
  derecha: 'end',
};

/** Redondea para que el marcado no se llene de decimales. */
function n(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
