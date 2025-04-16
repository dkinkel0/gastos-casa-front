import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Gasto {
  descripcion: string;
  monto: number;
  fecha: string;
  categoria: string;
}

@Injectable({
  providedIn: 'root'
})
export class GastoService {
  private apiUrl = 'http://localhost:8585/api/gasto'; // Ajusta esta URL según tu backend

  constructor(private http: HttpClient) { }

  crearGasto(gasto: Gasto): Observable<any> {
    return this.http.post(this.apiUrl, gasto);
  }
}
