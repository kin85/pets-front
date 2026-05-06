import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subject, Subscription, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import {
  AdminBootstrap,
  AdminService,
  DatatablesRequest,
  DatatablesResponse,
} from '../../services/admin';
import { SessionService } from '../../services/session';
import { NoteDto } from '../../services/note.service';
import { VeterinaryVisitDto } from '../../services/veterinary-visit.service';
import { VeterinaryTreatmentDto } from '../../services/veterinary-treatment.service';
import { DewormingDto } from '../../services/deworming.service';

type SectionId =
  | 'users'
  | 'dogs'
  | 'veterinaries'
  | 'vaccines'
  | 'notes'
  | 'visits'
  | 'treatments'
  | 'deworming';

type RowData = Record<string, string>;
type FieldType = 'text' | 'textarea' | 'date' | 'select' | 'checkbox';
type OptionSource = keyof Pick<
  AdminBootstrap,
  'dogs' | 'veterinaries' | 'visits' | 'administrationRoutes' | 'dewormerTypes'
>;

type FieldConfig = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  optionSource?: OptionSource;
  placeholder?: string;
  prefillToday?: boolean;
};

type ColumnConfig = {
  key: string;
  label: string;
  emphasis?: boolean;
};

type SectionConfig = {
  id: SectionId;
  label: string;
  title: string;
  description: string;
  columns: ColumnConfig[];
  defaultSortKey: string;
  defaultSortDir: 'asc' | 'desc';
  searchPlaceholder: string;
  createLabel?: string;
  allowCreate: boolean;
  allowEdit: boolean;
  allowDelete: boolean;
  fields: FieldConfig[];
  load: (request: DatatablesRequest) => Observable<DatatablesResponse<RowData>>;
  create?: (payload: unknown) => Observable<unknown>;
  update?: (id: number, payload: unknown) => Observable<unknown>;
  delete?: (id: number) => Observable<unknown>;
  toPayload?: (rawValue: Record<string, unknown>) => unknown;
};

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin implements OnInit, OnDestroy {
  readonly pageSize = 10;
  readonly sections: SectionConfig[];

  readonly search$ = new Subject<string>();
  readonly subscriptions = new Subscription();

  readonly bootstrap: AdminBootstrap = {
    dogs: [],
    veterinaries: [],
    visits: [],
    administrationRoutes: [],
    dewormerTypes: [],
  };

  activeSectionId: SectionId = 'users';
  rows: RowData[] = [];
  totalFiltered = 0;
  pageIndex = 0;
  searchTerm = '';
  loading = false;
  saving = false;
  deleting = false;
  bootstrapping = false;
  error = '';

  formMode: 'create' | 'edit' | null = null;
  editingRowId: number | null = null;
  deletingRow: RowData | null = null;

  form = new FormGroup({});

  constructor(
    private readonly adminService: AdminService,
    private readonly session: SessionService,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.sections = this.buildSections();
    this.subscriptions.add(
      this.search$
        .pipe(debounceTime(250), distinctUntilChanged())
        .subscribe((value) => {
          this.searchTerm = value;
          this.pageIndex = 0;
          this.loadRows();
        })
    );
  }

  ngOnInit(): void {
    this.refreshBootstrap();
    this.loadRows();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  logout(): void {
    this.session.clear();
    this.router.navigate(['/login']);
  }

  selectSection(sectionId: SectionId): void {
    if (this.activeSectionId === sectionId) {
      return;
    }

    this.activeSectionId = sectionId;
    this.pageIndex = 0;
    this.searchTerm = '';
    this.error = '';
    this.closeForm();
    this.closeDeleteModal();
    this.loadRows();
  }

  onSearchInput(value: string): void {
    this.search$.next(value);
  }

  previousPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex -= 1;
      this.loadRows();
    }
  }

  nextPage(): void {
    if (this.pageIndex + 1 < this.totalPages) {
      this.pageIndex += 1;
      this.loadRows();
    }
  }

  openCreate(): void {
    if (!this.activeSection.allowCreate) {
      return;
    }

    this.error = '';
    this.formMode = 'create';
    this.editingRowId = null;
    this.form = this.buildForm(this.activeSection.fields);
  }

  openEdit(row: RowData): void {
    if (!this.activeSection.allowEdit) {
      return;
    }

    this.error = '';
    this.formMode = 'edit';
    this.editingRowId = Number(row['id']);
    this.form = this.buildForm(this.activeSection.fields, row);
  }

  closeForm(): void {
    if (this.saving) {
      return;
    }

    this.formMode = null;
    this.editingRowId = null;
    this.form.reset();
  }

  openDeleteModal(row: RowData): void {
    if (!this.activeSection.allowDelete) {
      return;
    }

    this.error = '';
    this.deletingRow = row;
  }

  closeDeleteModal(): void {
    if (this.deleting) {
      return;
    }

    this.deletingRow = null;
  }

  save(): void {
    if (!this.formMode || !this.activeSection.toPayload) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.activeSection.toPayload(this.form.getRawValue());
    const request =
      this.formMode === 'create'
        ? this.activeSection.create?.(payload)
        : this.editingRowId != null
          ? this.activeSection.update?.(this.editingRowId, payload)
          : undefined;

    if (!request) {
      return;
    }

    this.saving = true;
    this.error = '';

    request
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.closeForm();
          this.refreshBootstrap();
          this.loadRows();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = this.getErrorMessage(err, 'No se pudo guardar el registro');
          this.cdr.detectChanges();
        },
      });
  }

  confirmDelete(): void {
    const row = this.deletingRow;
    if (!row || !this.activeSection.delete) {
      return;
    }

    this.deleting = true;
    this.error = '';

    this.activeSection
      .delete(Number(row['id']))
      .pipe(
        finalize(() => {
          this.deleting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.deletingRow = null;
          this.refreshBootstrap();
          if (this.pageIndex > 0 && this.rows.length === 1) {
            this.pageIndex -= 1;
          }
          this.loadRows();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = this.getErrorMessage(err, 'No se pudo eliminar el registro');
          this.cdr.detectChanges();
        },
      });
  }

  get controlKeys(): string[] {
    return Object.keys(this.form.controls);
  }

  get activeSection(): SectionConfig {
    return this.sections.find((section) => section.id === this.activeSectionId) ?? this.sections[0];
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalFiltered / this.pageSize));
  }

  get sectionSummary(): string {
    if (!this.totalFiltered) {
      return 'Sin resultados';
    }

    const from = this.pageIndex * this.pageSize + 1;
    const to = Math.min(this.totalFiltered, from + this.rows.length - 1);
    return `Mostrando ${from}-${to} de ${this.totalFiltered}`;
  }

  get deleteLabel(): string {
    if (!this.deletingRow) {
      return '';
    }

    const key =
      this.activeSection.columns.find((column) => column.emphasis)?.key ??
      this.activeSection.columns[0]?.key ??
      'id';
    return this.deletingRow[key] || `#${this.deletingRow['id']}`;
  }

  getOptionEntries(field: FieldConfig): Array<{ value: string; label: string }> {
    if (!field.optionSource) {
      return [];
    }

    if (field.optionSource === 'administrationRoutes' || field.optionSource === 'dewormerTypes') {
      return this.bootstrap[field.optionSource].map((value) => ({
        value,
        label: this.formatEnumLabel(value),
      }));
    }

    return this.bootstrap[field.optionSource].map((option) => ({
      value: String(option.id),
      label: option.label,
    }));
  }

  displayValue(columnKey: string, value: string | undefined): string {
    if (!value) {
      return 'Sin dato';
    }

    if (columnKey === 'administrationRoute' || columnKey === 'type') {
      return this.formatEnumLabel(value);
    }

    return value;
  }

  fieldHasError(fieldKey: string): boolean {
    const control = this.form.get(fieldKey);
    return !!control && control.touched && control.invalid;
  }

  private buildSections(): SectionConfig[] {
    return [
      {
        id: 'users',
        label: 'Usuarios',
        title: 'Gestion de usuarios',
        description:
          'Consulta todas las cuentas registradas, elimina usuarios y decide quien tiene acceso de administrador.',
        columns: [
          { key: 'username', label: 'Usuario', emphasis: true },
          { key: 'email', label: 'Email' },
          { key: 'roles', label: 'Roles' },
          { key: 'ownerName', label: 'Perfil' },
        ],
        defaultSortKey: 'username',
        defaultSortDir: 'asc',
        searchPlaceholder: 'Buscar por usuario, email o rol',
        allowCreate: false,
        allowEdit: true,
        allowDelete: true,
        fields: [{ key: 'isAdmin', label: 'Rol de administrador', type: 'checkbox' }],
        load: (request) => this.adminService.searchUsers(request),
        update: (id, payload) => this.adminService.updateUserAdminRole(id, payload as never),
        delete: (id) => this.adminService.deleteUser(id),
        toPayload: (rawValue) => ({
          admin: this.asBoolean(rawValue['isAdmin']),
        }),
      },
      {
        id: 'dogs',
        label: 'Perros',
        title: 'Registro global de perros',
        description:
          'Vista administrativa de todos los perros registrados con sus datos base y su propietario.',
        columns: [
          { key: 'name', label: 'Nombre', emphasis: true },
          { key: 'breed', label: 'Raza' },
          { key: 'birthDate', label: 'Nacimiento' },
          { key: 'microchip', label: 'Microchip' },
          { key: 'ownerName', label: 'Propietario' },
        ],
        defaultSortKey: 'name',
        defaultSortDir: 'asc',
        searchPlaceholder: 'Buscar por nombre, raza, microchip o propietario',
        allowCreate: false,
        allowEdit: false,
        allowDelete: true,
        fields: [],
        load: (request) => this.adminService.searchDogs(request),
        delete: (id) => this.adminService.deleteDog(id),
      },
      {
        id: 'veterinaries',
        label: 'Veterinarios',
        title: 'Directorio de veterinarios',
        description: 'Alta, edicion y limpieza del listado de veterinarios disponible en la app.',
        columns: [
          { key: 'name', label: 'Nombre', emphasis: true },
          { key: 'phone', label: 'Telefono' },
          { key: 'address', label: 'Direccion' },
          { key: 'schedule', label: 'Horario' },
          { key: 'emergencies', label: 'Urgencias' },
        ],
        defaultSortKey: 'name',
        defaultSortDir: 'asc',
        searchPlaceholder: 'Buscar por nombre, telefono, direccion o horario',
        createLabel: 'Nuevo veterinario',
        allowCreate: true,
        allowEdit: true,
        allowDelete: true,
        fields: [
          { key: 'name', label: 'Nombre', type: 'text', required: true },
          { key: 'phone', label: 'Telefono', type: 'text', required: true },
          { key: 'address', label: 'Direccion', type: 'text', required: true },
          { key: 'schedule', label: 'Horario', type: 'text', placeholder: 'L-V 9:00 a 18:00' },
          { key: 'url', label: 'Web o mapa', type: 'text', placeholder: 'https://...' },
          { key: 'emergencies', label: 'Tiene servicio de urgencias', type: 'checkbox' },
        ],
        load: (request) => this.adminService.searchVeterinaries(request),
        create: (payload) => this.adminService.createVeterinary(payload as never),
        update: (id, payload) => this.adminService.updateVeterinary(id, payload as never),
        delete: (id) => this.adminService.deleteVeterinary(id),
        toPayload: (rawValue) => ({
          name: this.asTrimmedText(rawValue['name']),
          phone: this.asTrimmedText(rawValue['phone']),
          address: this.asTrimmedText(rawValue['address']),
          schedule: this.asOptionalText(rawValue['schedule']),
          url: this.asOptionalText(rawValue['url']),
          emergencies: this.asBoolean(rawValue['emergencies']),
        }),
      },
      {
        id: 'vaccines',
        label: 'Vacunas',
        title: 'Catalogo de vacunas',
        description:
          'Gestiona las vacunas disponibles para asignar a los perros y para el seguimiento sanitario.',
        columns: [
          { key: 'name', label: 'Vacuna', emphasis: true },
          { key: 'optional', label: 'Opcional' },
        ],
        defaultSortKey: 'name',
        defaultSortDir: 'asc',
        searchPlaceholder: 'Buscar por nombre',
        createLabel: 'Nueva vacuna',
        allowCreate: true,
        allowEdit: true,
        allowDelete: true,
        fields: [
          { key: 'name', label: 'Nombre', type: 'text', required: true },
          { key: 'optional', label: 'Es opcional', type: 'checkbox' },
        ],
        load: (request) => this.adminService.searchVaccines(request),
        create: (payload) => this.adminService.createVaccine(payload as never),
        update: (id, payload) => this.adminService.updateVaccine(id, payload as never),
        delete: (id) => this.adminService.deleteVaccine(id),
        toPayload: (rawValue) => ({
          name: this.asTrimmedText(rawValue['name']),
          optional: this.asBoolean(rawValue['optional']),
        }),
      },
      {
        id: 'notes',
        label: 'Notas',
        title: 'Notas clinicas',
        description:
          'Panel global para crear, editar y borrar notas asociadas a cualquier perro del sistema.',
        columns: [
          { key: 'noteDate', label: 'Fecha' },
          { key: 'dogName', label: 'Perro' },
          { key: 'subject', label: 'Asunto', emphasis: true },
          { key: 'content', label: 'Contenido' },
        ],
        defaultSortKey: 'noteDate',
        defaultSortDir: 'desc',
        searchPlaceholder: 'Buscar por perro, asunto o contenido',
        createLabel: 'Nueva nota',
        allowCreate: true,
        allowEdit: true,
        allowDelete: true,
        fields: [
          { key: 'dogId', label: 'Perro', type: 'select', optionSource: 'dogs', required: true },
          { key: 'noteDate', label: 'Fecha', type: 'date', required: true, prefillToday: true },
          { key: 'subject', label: 'Asunto', type: 'text', required: true },
          { key: 'content', label: 'Contenido', type: 'textarea', required: true },
        ],
        load: (request) => this.adminService.searchNotes(request),
        create: (payload) => this.adminService.createNote(payload as NoteDto),
        update: (id, payload) => this.adminService.updateNote(id, payload as NoteDto),
        delete: (id) => this.adminService.deleteNote(id),
        toPayload: (rawValue) => ({
          dogId: this.asNumber(rawValue['dogId']),
          noteDate: this.asText(rawValue['noteDate']),
          subject: this.asTrimmedText(rawValue['subject']),
          content: this.asTrimmedText(rawValue['content']),
        }),
      },
      {
        id: 'visits',
        label: 'Visitas',
        title: 'Visitas veterinarias',
        description:
          'Registro global de visitas con sus diagnosticos, observaciones y centro veterinario asociado.',
        columns: [
          { key: 'visitDate', label: 'Fecha' },
          { key: 'dogName', label: 'Perro' },
          { key: 'veterinaryName', label: 'Veterinario' },
          { key: 'reason', label: 'Motivo', emphasis: true },
          { key: 'diagnosis', label: 'Diagnostico' },
        ],
        defaultSortKey: 'visitDate',
        defaultSortDir: 'desc',
        searchPlaceholder: 'Buscar por perro, veterinario, motivo o diagnostico',
        createLabel: 'Nueva visita',
        allowCreate: true,
        allowEdit: true,
        allowDelete: true,
        fields: [
          { key: 'dogId', label: 'Perro', type: 'select', optionSource: 'dogs', required: true },
          {
            key: 'veterinaryId',
            label: 'Veterinario',
            type: 'select',
            optionSource: 'veterinaries',
            required: true,
          },
          { key: 'visitDate', label: 'Fecha', type: 'date', required: true, prefillToday: true },
          { key: 'reason', label: 'Motivo', type: 'textarea', required: true },
          { key: 'diagnosis', label: 'Diagnostico', type: 'textarea' },
          { key: 'observations', label: 'Observaciones', type: 'textarea' },
        ],
        load: (request) => this.adminService.searchVisits(request),
        create: (payload) => this.adminService.createVisit(payload as VeterinaryVisitDto),
        update: (id, payload) => this.adminService.updateVisit(id, payload as VeterinaryVisitDto),
        delete: (id) => this.adminService.deleteVisit(id),
        toPayload: (rawValue) => ({
          dogId: this.asNumber(rawValue['dogId']),
          veterinaryId: this.asNumber(rawValue['veterinaryId']),
          visitDate: this.asText(rawValue['visitDate']),
          reason: this.asTrimmedText(rawValue['reason']),
          diagnosis: this.asOptionalText(rawValue['diagnosis']) ?? '',
          observations: this.asOptionalText(rawValue['observations']) ?? '',
        }),
      },
      {
        id: 'treatments',
        label: 'Tratamientos',
        title: 'Tratamientos prescritos',
        description:
          'Gestiona tratamientos ligados a visitas veterinarias con pautas, dosis y via de administracion.',
        columns: [
          { key: 'medicineName', label: 'Medicamento', emphasis: true },
          { key: 'dogName', label: 'Perro' },
          { key: 'veterinaryName', label: 'Veterinario' },
          { key: 'startDate', label: 'Inicio' },
          { key: 'administrationRoute', label: 'Via' },
        ],
        defaultSortKey: 'startDate',
        defaultSortDir: 'desc',
        searchPlaceholder: 'Buscar por medicamento, perro, veterinario o via',
        createLabel: 'Nuevo tratamiento',
        allowCreate: true,
        allowEdit: true,
        allowDelete: true,
        fields: [
          {
            key: 'veterinaryVisitId',
            label: 'Visita',
            type: 'select',
            optionSource: 'visits',
            required: true,
          },
          { key: 'medicineName', label: 'Medicamento', type: 'text', required: true },
          { key: 'description', label: 'Descripcion', type: 'textarea', required: true },
          { key: 'startDate', label: 'Fecha de inicio', type: 'date', required: true, prefillToday: true },
          { key: 'endDate', label: 'Fecha de fin', type: 'date' },
          { key: 'dose', label: 'Dosis', type: 'text' },
          { key: 'frequency', label: 'Frecuencia', type: 'text' },
          {
            key: 'administrationRoute',
            label: 'Via de administracion',
            type: 'select',
            optionSource: 'administrationRoutes',
          },
          { key: 'instructions', label: 'Instrucciones', type: 'textarea' },
        ],
        load: (request) => this.adminService.searchTreatments(request),
        create: (payload) => this.adminService.createTreatment(payload as VeterinaryTreatmentDto),
        update: (id, payload) =>
          this.adminService.updateTreatment(id, payload as VeterinaryTreatmentDto),
        delete: (id) => this.adminService.deleteTreatment(id),
        toPayload: (rawValue) => ({
          veterinaryVisitId: this.asNumber(rawValue['veterinaryVisitId']),
          medicineName: this.asTrimmedText(rawValue['medicineName']),
          description: this.asTrimmedText(rawValue['description']),
          startDate: this.asText(rawValue['startDate']),
          endDate: this.asOptionalText(rawValue['endDate']),
          dose: this.asOptionalText(rawValue['dose']) ?? '',
          frequency: this.asOptionalText(rawValue['frequency']) ?? '',
          administrationRoute: this.asOptionalText(rawValue['administrationRoute']),
          instructions: this.asOptionalText(rawValue['instructions']) ?? '',
        }),
      },
      {
        id: 'deworming',
        label: 'Desparasitaciones',
        title: 'Desparasitacion',
        description:
          'Alta y seguimiento global de desparasitaciones internas y externas de todos los perros.',
        columns: [
          { key: 'administrationDate', label: 'Fecha' },
          { key: 'dogName', label: 'Perro' },
          { key: 'name', label: 'Producto', emphasis: true },
          { key: 'type', label: 'Tipo' },
          { key: 'expirationDate', label: 'Caducidad' },
        ],
        defaultSortKey: 'administrationDate',
        defaultSortDir: 'desc',
        searchPlaceholder: 'Buscar por perro, producto o tipo',
        createLabel: 'Nueva desparasitacion',
        allowCreate: true,
        allowEdit: false,
        allowDelete: true,
        fields: [
          { key: 'dogId', label: 'Perro', type: 'select', optionSource: 'dogs', required: true },
          { key: 'name', label: 'Producto', type: 'text', required: true },
          {
            key: 'administrationDate',
            label: 'Fecha de administracion',
            type: 'date',
            required: true,
            prefillToday: true,
          },
          { key: 'expirationDate', label: 'Fecha de caducidad', type: 'date' },
          { key: 'type', label: 'Tipo', type: 'select', optionSource: 'dewormerTypes', required: true },
        ],
        load: (request) => this.adminService.searchDeworming(request),
        create: (payload) => this.adminService.createDeworming(payload as DewormingDto),
        delete: (id) => this.adminService.deleteDeworming(id),
        toPayload: (rawValue) => ({
          dogId: this.asNumber(rawValue['dogId']),
          name: this.asTrimmedText(rawValue['name']),
          administrationDate: this.asText(rawValue['administrationDate']),
          expirationDate: this.asOptionalText(rawValue['expirationDate']),
          type: this.asText(rawValue['type']),
        }),
      },
    ];
  }

  private loadRows(): void {
    this.loading = true;
    this.error = '';

    this.activeSection
      .load(this.buildRequest())
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.rows = Array.isArray(response.data) ? response.data : [];
          this.totalFiltered = Number(response.recordsFiltered ?? response.recordsTotal ?? 0);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.rows = [];
          this.totalFiltered = 0;
          this.error = this.getErrorMessage(err, 'No se pudo cargar la informacion');
          this.cdr.detectChanges();
        },
      });
  }

  private refreshBootstrap(): void {
    this.bootstrapping = true;
    this.adminService
      .getBootstrap()
      .pipe(
        finalize(() => {
          this.bootstrapping = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.bootstrap.dogs = response.dogs ?? [];
          this.bootstrap.veterinaries = response.veterinaries ?? [];
          this.bootstrap.visits = response.visits ?? [];
          this.bootstrap.administrationRoutes = response.administrationRoutes ?? [];
          this.bootstrap.dewormerTypes = response.dewormerTypes ?? [];
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = this.getErrorMessage(err, 'No se pudieron cargar las opciones administrativas');
          this.cdr.detectChanges();
        },
      });
  }

  private buildRequest(): DatatablesRequest {
    const columns = this.activeSection.columns.map((column) => ({
      data: column.key,
      name: column.key,
      searchable: true,
      orderable: true,
      search: { value: '', regex: false },
    }));

    const sortColumnIndex = Math.max(
      0,
      columns.findIndex((column) => column.data === this.activeSection.defaultSortKey)
    );

    return {
      draw: 1,
      start: this.pageIndex * this.pageSize,
      length: this.pageSize,
      searchValue: this.searchTerm,
      order: [{ column: sortColumnIndex, dir: this.activeSection.defaultSortDir }],
      columns,
    };
  }

  private buildForm(fields: FieldConfig[], row?: RowData) {
    const controls: Record<string, FormControl> = {};

    for (const field of fields) {
      const initialValue = row ? this.getEditValue(field, row) : this.getCreateValue(field);
      controls[field.key] = this.fb.control(initialValue, field.required ? Validators.required : []);
    }

    return this.fb.group(controls);
  }

  private getCreateValue(field: FieldConfig): string | boolean {
    if (field.type === 'checkbox') {
      return false;
    }
    if (field.prefillToday) {
      return this.today();
    }
    return '';
  }

  private getEditValue(field: FieldConfig, row: RowData): string | boolean {
    const rawValue = row[field.key] ?? '';
    if (field.type === 'checkbox') {
      return rawValue === 'Si' || rawValue === 'true';
    }
    return rawValue;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private formatEnumLabel(value: string): string {
    switch (value) {
      case 'ORAL':
        return 'Oral';
      case 'TOPICA':
        return 'Topica';
      case 'INYECTABLE':
        return 'Inyectable';
      case 'INTERNA':
        return 'Interna';
      case 'EXTERNA':
        return 'Externa';
      default:
        return value
          .toLowerCase()
          .split('_')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
    }
  }

  private asText(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private asTrimmedText(value: unknown): string {
    return this.asText(value).trim();
  }

  private asOptionalText(value: unknown): string | null {
    const trimmed = this.asTrimmedText(value);
    return trimmed ? trimmed : null;
  }

  private asNumber(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }

    const parsed = Number(this.asText(value));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private asBoolean(value: unknown): boolean {
    return value === true || value === 'true' || value === 'Si';
  }

  private getErrorMessage(err: unknown, fallback: string): string {
    if (typeof err === 'object' && err !== null) {
      const httpError = err as { error?: unknown };
      if (typeof httpError.error === 'string' && httpError.error.trim()) {
        return httpError.error;
      }
      if (
        typeof httpError.error === 'object' &&
        httpError.error !== null &&
        'message' in httpError.error
      ) {
        const message = (httpError.error as { message?: unknown }).message;
        if (typeof message === 'string' && message.trim()) {
          return message;
        }
      }
    }

    return fallback;
  }
}
