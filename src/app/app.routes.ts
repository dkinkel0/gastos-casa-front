import { Routes } from '@angular/router';
import { FormaPagoComponent } from './components/forma-pago/forma-pago.component';
import { TipoGastoComponent } from './components/tipo-gasto/tipo-gasto.component';

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
  },
  {
    path: 'configuracion',
    loadComponent: () => import('./components/configuracion/configuracion.component')
      .then(m => m.ConfiguracionComponent)
  },
  {
    path: 'tipo-gasto',
    component: TipoGastoComponent
  },
  {
    path: 'configuracion/tipo-gasto',
    component: TipoGastoComponent
  },
  { path: 'forma-pago', component: FormaPagoComponent }
];