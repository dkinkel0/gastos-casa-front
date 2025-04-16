import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Cotizacion {
  fecha: string;
  valor: number;
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
  private apiUrl = 'http://localhost:3535/api';

  constructor(private http: HttpClient) { }

  crearGasto(gasto: Gasto): Observable<Gasto> {
    return this.http.post<Gasto>(`${this.apiUrl}/gasto`, gasto);
  }

  getCotizacionDolar(fecha: string): Observable<Cotizacion> {
    return this.http.get<Cotizacion>(`${this.apiUrl}/cotizacion/${fecha}`);
  }
}
