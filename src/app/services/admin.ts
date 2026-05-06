import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NoteDto } from './note.service';
import { VeterinaryVisitDto } from './veterinary-visit.service';
import { VeterinaryTreatmentDto } from './veterinary-treatment.service';
import { DewormingDto } from './deworming.service';

export type DatatablesColumn = {
  data: string;
  name: string;
  searchable: boolean;
  orderable: boolean;
  search: { value: string; regex: boolean };
};

export type DatatablesRequest = {
  draw: number;
  start: number;
  length: number;
  searchValue: string;
  order: Array<{ column: number; dir: 'asc' | 'desc' }>;
  columns: DatatablesColumn[];
};

export type DatatablesResponse<T> = {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: T[];
};

export type AdminOption = {
  id: number;
  label: string;
};

export type AdminBootstrap = {
  dogs: AdminOption[];
  veterinaries: AdminOption[];
  visits: AdminOption[];
  administrationRoutes: string[];
  dewormerTypes: string[];
};

export type VeterinaryAdminDto = {
  name: string;
  address: string;
  phone: string;
  schedule: string | null;
  emergencies: boolean;
  url: string | null;
};

export type VaccineAdminDto = {
  name: string;
  optional: boolean;
};

export type UserAdminRoleUpdateDto = {
  admin: boolean;
};

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly adminUrl = 'https://pets-x11k.onrender.com/api/admin';
  private readonly notesUrl = 'https://pets-x11k.onrender.com/api/notes';
  private readonly visitsUrl = 'https://pets-x11k.onrender.com/api/veterinary-visits';
  private readonly treatmentsUrl = 'https://pets-x11k.onrender.com/api/veterinary-treatments';
  private readonly dewormingUrl = 'https://pets-x11k.onrender.com/api/deworming';
  private readonly dogsUrl = 'https://pets-x11k.onrender.com/api/dogs';

  constructor(private http: HttpClient) {}

  getBootstrap(): Observable<AdminBootstrap> {
    return this.http.get<AdminBootstrap>(`${this.adminUrl}/bootstrap`);
  }

  searchUsers(body: DatatablesRequest): Observable<DatatablesResponse<Record<string, string>>> {
    return this.http.post<DatatablesResponse<Record<string, string>>>(
      `${this.adminUrl}/users/datatables`,
      body
    );
  }

  updateUserAdminRole(id: number, body: UserAdminRoleUpdateDto): Observable<void> {
    return this.http.put<void>(`${this.adminUrl}/users/${id}/admin-role`, body);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/users/${id}`);
  }

  searchDogs(body: DatatablesRequest): Observable<DatatablesResponse<Record<string, string>>> {
    return this.http.post<DatatablesResponse<Record<string, string>>>(
      `${this.adminUrl}/dogs/datatables`,
      body
    );
  }

  deleteDog(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/dogs/${id}`);
  }

  searchVeterinaries(body: DatatablesRequest): Observable<DatatablesResponse<Record<string, string>>> {
    return this.http.post<DatatablesResponse<Record<string, string>>>(
      `${this.adminUrl}/veterinaries/datatables`,
      body
    );
  }

  createVeterinary(body: VeterinaryAdminDto): Observable<number> {
    return this.http.post<number>(`${this.adminUrl}/veterinaries`, body);
  }

  updateVeterinary(id: number, body: VeterinaryAdminDto): Observable<void> {
    return this.http.put<void>(`${this.adminUrl}/veterinaries/${id}`, body);
  }

  deleteVeterinary(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/veterinaries/${id}`);
  }

  searchVaccines(body: DatatablesRequest): Observable<DatatablesResponse<Record<string, string>>> {
    return this.http.post<DatatablesResponse<Record<string, string>>>(
      `${this.adminUrl}/vaccines/datatables`,
      body
    );
  }

  createVaccine(body: VaccineAdminDto): Observable<number> {
    return this.http.post<number>(`${this.adminUrl}/vaccines`, body);
  }

  updateVaccine(id: number, body: VaccineAdminDto): Observable<void> {
    return this.http.put<void>(`${this.adminUrl}/vaccines/${id}`, body);
  }

  deleteVaccine(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/vaccines/${id}`);
  }

  searchNotes(body: DatatablesRequest): Observable<DatatablesResponse<Record<string, string>>> {
    return this.http.post<DatatablesResponse<Record<string, string>>>(
      `${this.adminUrl}/notes/datatables`,
      body
    );
  }

  createNote(body: NoteDto): Observable<number> {
    return this.http.post<number>(this.notesUrl, body);
  }

  updateNote(id: number, body: NoteDto): Observable<void> {
    return this.http.put<void>(`${this.notesUrl}/${id}`, body);
  }

  deleteNote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.notesUrl}/${id}`);
  }

  searchVisits(body: DatatablesRequest): Observable<DatatablesResponse<Record<string, string>>> {
    return this.http.post<DatatablesResponse<Record<string, string>>>(
      `${this.adminUrl}/visits/datatables`,
      body
    );
  }

  createVisit(body: VeterinaryVisitDto): Observable<number> {
    return this.http.post<number>(this.visitsUrl, body);
  }

  updateVisit(id: number, body: VeterinaryVisitDto): Observable<void> {
    return this.http.put<void>(`${this.visitsUrl}/${id}`, body);
  }

  deleteVisit(id: number): Observable<void> {
    return this.http.delete<void>(`${this.visitsUrl}/${id}`);
  }

  searchTreatments(body: DatatablesRequest): Observable<DatatablesResponse<Record<string, string>>> {
    return this.http.post<DatatablesResponse<Record<string, string>>>(
      `${this.adminUrl}/treatments/datatables`,
      body
    );
  }

  createTreatment(body: VeterinaryTreatmentDto): Observable<number> {
    return this.http.post<number>(this.treatmentsUrl, body);
  }

  updateTreatment(id: number, body: VeterinaryTreatmentDto): Observable<void> {
    return this.http.put<void>(`${this.treatmentsUrl}/${id}`, body);
  }

  deleteTreatment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.treatmentsUrl}/${id}`);
  }

  searchDeworming(body: DatatablesRequest): Observable<DatatablesResponse<Record<string, string>>> {
    return this.http.post<DatatablesResponse<Record<string, string>>>(
      `${this.adminUrl}/deworming/datatables`,
      body
    );
  }

  createDeworming(body: DewormingDto): Observable<number> {
    return this.http.post<number>(`${this.dogsUrl}/deworming`, body);
  }

  deleteDeworming(id: number): Observable<void> {
    return this.http.delete<void>(`${this.dewormingUrl}/${id}`);
  }
}
