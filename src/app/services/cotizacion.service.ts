import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class CotizacionService {
  private apiUrl = 'http://localhost:8585/api/cotizacion'; // Corregido al puerto 8585

  constructor(private http: HttpClient) { }

  // Obtener todas las cotizaciones
  getCotizaciones(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Guardar nueva cotización
  createCotizacion(cotizacion: any): Observable<any> {
    return this.http.post(this.apiUrl, cotizacion);
  }

  // Obtener cotización por ID
  getCotizacionById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // Actualizar cotización
  updateCotizacion(id: number, cotizacion: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update/${id}`, cotizacion);
  }

  // Eliminar cotización
  deleteCotizacion(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }

  saveCotizacion(cotizacion: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, cotizacion);
  }
}