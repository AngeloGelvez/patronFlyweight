import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { TestBed } from '@angular/core/testing';
import { ObserverPage } from './observer.page';

describe('ObserverPage', () => {
  beforeAll(() => registerLocaleData(localeEs));

  it('el pedido avanza y los observadores se enteran', () => {
    const fixture = TestBed.createComponent(ObserverPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const pulsar = (texto: string) => {
      Array.from(el.querySelectorAll('button'))
        .find((b) => b.textContent!.trim().startsWith(texto))!
        .click();
      fixture.detectChanges();
    };

    pulsar('+ Fondo Norte');
    pulsar('Confirmar pedido');
    pulsar('Pagar');

    expect(el.querySelector('[data-testid="estado-actual"]')!.textContent!.trim()).toBe('Pagado');
    expect(el.textContent).toContain('¡tus entradas están listas!');
    expect(el.textContent).toContain('45 €');
  });

  it('un observador dado de baja deja de recibir avisos', () => {
    const fixture = TestBed.createComponent(ObserverPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const casilla = el.querySelector<HTMLInputElement>('article input[type="checkbox"]')!; // correo
    casilla.click();
    fixture.detectChanges();

    Array.from(el.querySelectorAll('button')).find((b) => b.textContent!.trim().startsWith('+ Fondo'))!.click();
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent!.trim() === 'Confirmar pedido')!.click();
    fixture.detectChanges();

    expect(el.textContent).toContain('Sin correos enviados');
  });
});
