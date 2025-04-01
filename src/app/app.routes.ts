import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'cotizacion-dolar',
    loadComponent: () => import('./components/cotizacion-dolar/cotizacion-dolar.component')
      .then(m => m.CotizacionDolarComponent)
  }
];