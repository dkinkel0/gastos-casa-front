import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TipoGastoService {
  private apiUrl = 'http://localhost:8585/api/tipo-gasto';

  constructor(private http: HttpClient) { }

  getTiposGasto(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createTipoGasto(tipoGasto: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, tipoGasto);
  }

  updateTipoGasto(tipoGasto: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${tipoGasto.id}`, tipoGasto);
  }

  deleteTipoGasto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
} 