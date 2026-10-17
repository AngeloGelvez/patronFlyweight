import { Dibujante, Estilo, EstiloTexto, ResultadoDibujo } from '../dibujante';

/**
 * IMPLEMENTACIÓN CONCRETA · Texto accesible.
 *
 * No pinta nada: cuenta las figuras y recoge los textos para describir la
 * escena con palabras. Sirve para lectores de pantalla y para comprobar qué
 * se está dibujando sin mirar la imagen.
 *
 * Es la prueba de que la abstracción no sabe nada del motor: la misma vista,
 * sin tocar una línea, puede terminar en píxeles o en una descripción.
 */
export class DibujanteTexto implements Dibujante {
  readonly id = 'texto' as const;
  readonly nombre = 'Texto accesible';

  private ancho = 0;
  private alto = 0;
  private figuras = new Map<string, number>();
  private textos: string[] = [];

  iniciar(ancho: number, alto: number): void {
    this.ancho = ancho;
    this.alto = alto;
    this.figuras = new Map();
    this.textos = [];
  }

  rectangulo(_x: number, _y: number, _ancho: number, _alto: number, estilo: Estilo = {}): void {
    this.contar(estilo.etiqueta ?? 'rectángulo');
  }

  circulo(_x: number, _y: number, _radio: number, estilo: Estilo = {}): void {
    this.contar(estilo.etiqueta ?? 'círculo');
  }

  linea(_x1: number, _y1: number, _x2: number, _y2: number, estilo: Estilo = {}): void {
    this.contar(estilo.etiqueta ?? 'línea');
  }

  texto(_x: number, _y: number, contenido: string, _estilo: EstiloTexto = {}): void {
    this.textos.push(contenido);
  }

  terminar(): ResultadoDibujo {
    const lineas = [`Lienzo de ${this.ancho} × ${this.alto} puntos.`, '', 'Figuras dibujadas:'];

    for (const [etiqueta, veces] of this.figuras) {
      lineas.push(`  ${veces.toLocaleString('es-ES').padStart(6)} × ${etiqueta}`);
    }

    if (this.textos.length > 0) {
      lineas.push('', `Textos (${this.textos.length}):`);
      for (const texto of this.textos) lineas.push(`  «${texto}»`);
    }

    return { tipo: 'texto', lineas };
  }

  private contar(etiqueta: string): void {
    this.figuras.set(etiqueta, (this.figuras.get(etiqueta) ?? 0) + 1);
  }
}
