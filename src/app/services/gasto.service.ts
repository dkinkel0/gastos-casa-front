import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'http://localhost:8585/api/gasto';

  constructor(private http: HttpClient) { }

  crearGasto(gasto: Gasto): Observable<any> {
    const gastoData = {
      fecha: gasto.fecha,
      detalle: gasto.detalle,
      tipoId: gasto.tipo,
      costo: gasto.costo,
      costoDolar: gasto.costoDolar,
      formaPagoId: gasto.formaPago,
      cuotas: gasto.cuotas
    };
    
    console.log('Enviando datos al backend:', gastoData);
    return this.http.post(this.apiUrl, gastoData);
  }

  getAllGastos(): Observable<Gasto[]> {
    return this.http.get<Gasto[]>(this.apiUrl);
  }

  getGastoById(id: number): Observable<Gasto> {
    return this.http.get<Gasto>(`${this.apiUrl}/${id}`);
  }

  updateGasto(id: number, gasto: Gasto): Observable<Gasto> {
    return this.http.put<Gasto>(`${this.apiUrl}/${id}`, gasto);
  }

  deleteGasto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
