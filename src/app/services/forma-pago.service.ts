import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FormaPago {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: string;  // "EFECTIVO" o "TARJETA"
  banco?: string;
  marcaTarjeta?: string;
  diaCierre?: number;
  diaVencimiento?: number;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FormaPagoService {
  private apiUrl = 'http://localhost:8585/api/forma-pago';

  constructor(private http: HttpClient) { }

  getFormasPago(): Observable<FormaPago[]> {
    return this.http.get<FormaPago[]>(this.apiUrl);
  }

  obtenerFormasPago(): Observable<FormaPago[]> {
    return this.getFormasPago();
  }

  crearFormaPago(formaPago: FormaPago): Observable<FormaPago> {
    return this.http.post<FormaPago>(this.apiUrl, formaPago);
  }

  actualizarFormaPago(id: number, formaPago: FormaPago): Observable<FormaPago> {
    return this.http.put<FormaPago>(`${this.apiUrl}/${id}`, formaPago);
  }

  eliminarFormaPago(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
} 