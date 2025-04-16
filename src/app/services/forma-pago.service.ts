import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FormaPago {
  id: number;
  nombre: string;
  tipo: string;  // "EFECTIVO" o "TARJETA"
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FormaPagoService {
  private apiUrl = 'http://localhost:3535/api/forma-pago';

  constructor(private http: HttpClient) { }

  getFormasPago(): Observable<FormaPago[]> {
    return this.http.get<FormaPago[]>(this.apiUrl);
  }
} 