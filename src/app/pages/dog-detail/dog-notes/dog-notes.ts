import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { NoteService, NoteViewDto } from '../../../services/note.service';

type NoteRow = {
  id: number;
  noteDate: string;
  subject: string;
  content: string;
};

@Component({
  selector: 'app-dog-notes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dog-notes.html',
  styleUrl: './dog-notes.scss',
})
export class DogNotes implements OnChanges, OnDestroy {
  @Input() dogId: number | null = null;

  loading = false;
  error = '';
  noteRows: NoteRow[] = [];
  totalFiltered = 0;
  pageSize = 10;
  pageIndex = 0;
  searchTerm = '';

  expandedId: number | null = null;
  editingId: number | null = null;
  deletingId: number | null = null;
  creating = false;
  creatingNote = false;
  deletingNote = false;

  private search$ = new Subject<string>();
  private subscriptions = new Subscription();

  createForm;
  editForm;

  constructor(
    private noteService: NoteService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.createForm = this.fb.group({
      noteDate: ['', Validators.required],
      subject: ['', [Validators.required, Validators.minLength(2)]],
      content: ['', [Validators.required, Validators.minLength(2)]],
    });
    this.editForm = this.fb.group({
      noteDate: ['', Validators.required],
      subject: ['', [Validators.required, Validators.minLength(2)]],
      content: ['', [Validators.required, Validators.minLength(2)]],
    });
    this.subscriptions.add(
      this.search$
        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe((value) => {
          this.searchTerm = value;
          this.pageIndex = 0;
          this.loadNotes();
        })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dogId']) {
      this.pageIndex = 0;
      this.loadNotes();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onSearchInput(value: string): void {
    this.search$.next(value);
  }

  previousPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex -= 1;
      this.loadNotes();
    }
  }

  nextPage(): void {
    if (this.pageIndex + 1 < this.totalPages) {
      this.pageIndex += 1;
      this.loadNotes();
    }
  }

  toggleExpand(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  startCreate(): void {
    this.creating = true;
    this.error = '';
    this.editingId = null;
    this.createForm.reset({
      noteDate: this.today(),
      subject: '',
      content: '',
    });
  }

  cancelCreate(): void {
    if (this.creatingNote) return;
    this.creating = false;
    this.createForm.reset();
  }

  saveCreate(): void {
    if (!this.dogId) return;

    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const { noteDate, subject, content } = this.createForm.getRawValue();
    this.creatingNote = true;
    this.error = '';

    this.noteService
      .create({
        noteDate: noteDate!,
        subject: subject!,
        content: content!,
        dogId: this.dogId,
      })
      .subscribe({
        next: () => {
          this.creatingNote = false;
          this.creating = false;
          this.pageIndex = 0;
          this.loadNotes();
        },
        error: (err) => {
          this.creatingNote = false;
          this.error = this.getErrorMessage(err, 'No se pudo crear la nota');
          this.cdr.detectChanges();
        },
      });
  }

  startEdit(id: number): void {
    this.creating = false;
    this.editingId = id;
    const row = this.noteRows.find((note) => note.id === id);
    if (row) {
      this.setEditForm(row);
    }
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(): void {
    if (!this.editingId || this.editForm.invalid || !this.dogId) {
      this.editForm.markAllAsTouched();
      return;
    }

    const editingId = this.editingId;
    const { noteDate, subject, content } = this.editForm.getRawValue();
    this.noteService
      .update(editingId, {
        noteDate: noteDate!,
        subject: subject!,
        content: content!,
        dogId: this.dogId,
      })
      .subscribe({
        next: () => {
          const row = this.noteRows.find((n) => n.id === editingId);
          if (row) {
            row.noteDate = noteDate!;
            row.subject = subject!;
            row.content = content!;
          }
          this.editingId = null;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = this.getErrorMessage(err, 'No se pudo actualizar la nota');
        },
      });
  }

  deleteNote(id: number): void {
    this.deletingId = id;
  }

  closeDeleteModal(): void {
    if (this.deletingNote) return;
    this.deletingId = null;
  }

  confirmDelete(): void {
    if (!this.deletingId || this.deletingNote) return;

    const noteId = this.deletingId;
    this.deletingNote = true;
    this.noteService.delete(noteId).subscribe({
      next: () => {
        this.deletingNote = false;
        this.deletingId = null;
        if (this.expandedId === noteId) this.expandedId = null;
        if (this.editingId === noteId) this.editingId = null;
        this.loadNotes();
      },
      error: (err) => {
        this.deletingNote = false;
        this.error = this.getErrorMessage(err, 'No se pudo borrar la nota');
        this.cdr.detectChanges();
      },
    });
  }

  private loadNotes(): void {
    if (!this.dogId) return;

    this.loading = true;
    this.error = '';
    this.expandedId = null;
    this.editingId = null;

    const start = this.pageIndex * this.pageSize;
    const searchPayload = {
      draw: 1,
      start,
      length: this.pageSize,
      searchValue: this.searchTerm,
      order: [{ column: 0, dir: 'desc' as const }],
      columns: [
        {
          data: 'noteDate',
          name: 'noteDate',
          searchable: true,
          orderable: true,
          search: { value: '', regex: false },
        },
        {
          data: 'subject',
          name: 'subject',
          searchable: true,
          orderable: true,
          search: { value: '', regex: false },
        },
      ],
      dogId: this.dogId,
    };

    this.noteService
      .searchNotes(searchPayload)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.totalFiltered = Number(res.recordsFiltered ?? res.recordsTotal ?? 0);
          const rows = Array.isArray(res.data) ? res.data : [];
          this.noteRows = rows.map((row) => ({
            id: Number(row['id']),
            noteDate: row['noteDate'],
            subject: row['subject'],
            content: row['content'] ?? '',
          }));
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = this.getErrorMessage(err, 'No se pudieron cargar las notas');
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private setEditForm(note: Pick<NoteViewDto, 'noteDate' | 'subject' | 'content'>): void {
    this.editForm.setValue({
      noteDate: note.noteDate,
      subject: note.subject,
      content: note.content,
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalFiltered / this.pageSize));
  }

  private today(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
