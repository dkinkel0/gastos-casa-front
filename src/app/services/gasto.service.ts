import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Cotizacion {
  id?: number;
  fecha: string;
  precioCompra: number;
  precioVenta: number;
  precioIntermedio: number;
}

export interface Gasto {
  id?: number;
  fecha: string;
  detalle: string;
  tipo: number;
  costo: number;
  costoDolar: number;
  formaPago: number;
  cuotas?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GastoService {
  private apiUrl = 'http://localhost:8585/api';

  constructor(private http: HttpClient) { }

  crearGasto(gasto: Gasto): Observable<Gasto> {
    return this.http.post<Gasto>(`${this.apiUrl}/gasto`, gasto);
  }

  getCotizacionDolar(fecha: string): Observable<Cotizacion> {
    return this.http.get<Cotizacion>(`${this.apiUrl}/cotizacion/${fecha}`);
  }
}
