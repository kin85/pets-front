import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NoteListRow {
  id: number;
  noteDate: string;
  subject: string;
  content: string;
}

export interface NoteViewDto {
  id: number;
  noteDate: string;
  subject: string;
  content: string;
  dogId: number;
  dogName: string;
}

export interface NoteDto {
  noteDate: string;
  subject: string;
  content: string;
  dogId: number;
}

export interface DatatablesResponse<T> {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: T[];
}

type DatatablesOrder = { column: number; dir: 'asc' | 'desc' };
type DatatablesColumn = {
  data: string;
  name: string;
  searchable: boolean;
  orderable: boolean;
  search: { value: string; regex: boolean };
};

export interface NoteSearchDto {
  draw: number;
  start: number;
  length: number;
  searchValue: string;
  order: DatatablesOrder[];
  columns: DatatablesColumn[];
  dogId: number;
}

@Injectable({ providedIn: 'root' })
export class NoteService {
  private readonly baseUrl = 'https://pets-x11k.onrender.com/api/notes';

  constructor(private http: HttpClient) {}

  searchNotes(search: NoteSearchDto): Observable<DatatablesResponse<Record<string, string>>> {
    return this.http.post<DatatablesResponse<Record<string, string>>>(
      `${this.baseUrl}/datatables`,
      search
    );
  }

  getById(id: number): Observable<NoteViewDto> {
    return this.http.get<NoteViewDto>(`${this.baseUrl}/${id}`);
  }

  create(body: NoteDto): Observable<number> {
    return this.http.post<number>(this.baseUrl, body);
  }

  update(id: number, body: NoteDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
