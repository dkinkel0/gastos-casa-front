import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Cotizacion {
  id: number;
  fecha: string;
  precioCompra: number;
  precioVenta: number;
  precioIntermedio: number;
}

@Injectable({
  providedIn: 'root'
})
export class CotizacionService {
  private apiUrl = 'http://localhost:8585/api/cotizacion';

  constructor(private http: HttpClient) { }

  getCotizacionByFecha(fecha: string): Observable<Cotizacion> {
    return this.http.get<Cotizacion>(`${this.apiUrl}/${fecha}`);
  }

  getAllCotizaciones(): Observable<Cotizacion[]> {
    return this.http.get<Cotizacion[]>(this.apiUrl);
  }

  createCotizacion(cotizacion: Cotizacion): Observable<Cotizacion> {
    return this.http.post<Cotizacion>(this.apiUrl, cotizacion);
  }

  deleteCotizacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}