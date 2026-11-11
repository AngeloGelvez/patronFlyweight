import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { TestBed } from '@angular/core/testing';
import { SimplePage } from './simple.page';

describe('SimplePage', () => {
  beforeAll(() => registerLocaleData(localeEs));

  function botones(el: HTMLElement): HTMLButtonElement[] {
    return Array.from(el.querySelectorAll('section button'));
  }

  it('cambia de estado al pulsar las acciones', () => {
    const fixture = TestBed.createComponent(SimplePage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const estado = () => el.querySelector('[data-testid="estado-actual"]')!.textContent!.trim();
    const pulsar = (texto: string) => {
      botones(el).find((b) => b.textContent!.trim() === texto)!.click();
      fixture.detectChanges();
    };

    expect(estado()).toBe('Disponible');
    pulsar('pagar');
    expect(estado()).toBe('Disponible');
    expect(el.querySelector('[role="status"]')!.textContent).toContain('No se puede pagar');
    pulsar('reservar');
    expect(estado()).toBe('Reservada');
    pulsar('pagar');
    expect(estado()).toBe('Pagada');
  });

  it('arma la tabla estado × acción a partir de las clases', () => {
    const fixture = TestBed.createComponent(SimplePage);
    fixture.detectChanges();
    const filas = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(filas.length).toBe(4);
    expect(filas[0].textContent).toContain('Reservada');
  });
});
