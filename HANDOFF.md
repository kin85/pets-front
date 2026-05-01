# HANDOFF

Ultima actualizacion: 2026-03-22

Este documento sirve como contexto rapido para retomar el proyecto en una conversacion nueva.

## Proyectos implicados

- Frontend: `/Users/joaquin/Documents/pets-front`
  - Angular standalone
  - App principal del usuario final
- Backend: `/Users/joaquin/Documents/pets`
  - Spring Boot + Maven
  - API REST consumida por el front

## Objetivo funcional actual

La app `Appets` permite a un propietario:

- autenticarse
- editar su perfil
- ver sus perros
- crear perros
- ver la ficha de un perro
- gestionar:
  - informacion basica
  - vacunas
  - desparasitacion
  - notas
  - visitas veterinarias
  - tratamientos asociados a visitas
- consultar veterinarios

## Decisiones importantes ya tomadas

- No usar `ownerId` en `localStorage` para cargar la home.
  - Solo se guarda el JWT.
  - La home se obtiene con el usuario autenticado.
- No recalcular en Angular la logica de negocio de salud del perro si puede vivir en backend.
  - Vacunas y desparasitacion ya se resumen en backend.
- No reconstruir relaciones por nombre si el backend puede devolver ids.
  - Las visitas veterinarias ya devuelven `dogId` y `veterinaryId`.
- Usar fechas ISO (`yyyy-MM-dd`) entre front y back en JSON siempre que sea posible.
  - Se eliminaron varias conversiones manuales en Angular.

## Rutas frontend relevantes

Zona publica:

- `/login`
- `/register`

Zona autenticada:

- `/home`
- `/veterinarians`
- `/profile`
- `/dogs/new`
- `/dogs/:id`
- `/dogs/:dogId/visits/new`
- `/dogs/:dogId/visits/:visitId/edit`
- `/veterinary-visits/:id`
- `/veterinary-visits/:visitId/treatments/new`
- `/veterinary-visits/:visitId/treatments/:treatmentId/edit`

## Estructura importante del front

- Shell autenticada:
  - `src/app/shared/owner-shell/`
- Home:
  - `src/app/pages/home/`
- Ficha de perro:
  - `src/app/pages/dog-detail/`
- Tabs del perro:
  - `dog-vaccines`
  - `dog-deworming`
  - `dog-notes`
  - `dog-visits`
- Formularios dedicados:
  - `src/app/pages/veterinary-visit-form/`
  - `src/app/pages/veterinary-treatment-form/`
- Perfil:
  - `src/app/pages/profile/`
  - `src/app/services/owner.service.ts`

## Contratos API importantes actuales

### Home autenticada

Endpoint:

- `GET /api/owners/me/home`

Respuesta esperada:

```json
{
  "name": "Sofia",
  "dogs": [
    {
      "id": 1,
      "name": "Pepe",
      "hasPhoto": true
    }
  ]
}
```

Uso:

- El front ya no usa `/api/owners/{id}/home`
- `hasPhoto` evita pedir blobs de foto cuando no existen

### Perfil autenticado

Endpoints usados:

- `GET /api/owners/me`
- `PUT /api/owners/me`

Respuesta esperada:

```json
{
  "username": "sofia",
  "email": "sofia@email.com",
  "name": "Sofia",
  "address": "Calle Mayor 1",
  "phone": "600123123"
}
```

Payload de actualizacion:

```json
{
  "email": "sofia@email.com",
  "name": "Sofia",
  "address": "Calle Mayor 1",
  "phone": "600123123",
  "password": "opcional"
}
```

Notas:

- `username` se muestra como dato fijo y no se edita desde el front
- esto evita invalidar el JWT actual
- `password` es opcional; si se envia vacia no cambia
- el backend valida email duplicado y devuelve conflicto si procede

### Perro

Endpoints usados:

- `GET /api/dogs/{id}`
- `GET /api/dogs/{id}/photo`
- `POST /api/dogs`
- `PUT /api/dogs/{id}`
- `DELETE /api/dogs/{id}`

Notas:

- `createDog` y `updateDog` usan `multipart/form-data`
- `birthDate` sigue yendo como string ISO en multipart
- las fotos nuevas ya no se guardan en disco local del backend
- backend sube a ImageKit y guarda la referencia serializada en `photoPath` con formato `imagekit|fileId|url`
- `DogHomeDto` y `DogViewDto` ya devuelven `photoUrl`
- el front usa `photoUrl` directo y deja `/api/dogs/{id}/photo` solo como fallback para fotos locales heredadas

Variables necesarias en backend para fotos:

- `IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_PRIVATE_KEY`
- `IMAGEKIT_URL_ENDPOINT`

### Vacunas

Endpoints antiguos que siguen existiendo:

- `GET /api/vaccines`
- `GET /api/dogs/{id}/vaccines`
- `POST /api/dogs/vaccine`

Endpoint nuevo orientado a UI:

- `GET /api/dogs/{id}/vaccines/overview`

Respuesta esperada:

```json
{
  "dogName": "Pepe",
  "currentVaccines": [
    {
      "id": 1,
      "name": "Rabia",
      "optional": false,
      "lastApplicationDate": "2026-01-10",
      "nextDueDate": "2027-01-10",
      "daysUntilDue": 295
    }
  ],
  "upcomingVaccines": [],
  "pendingVaccines": []
}
```

Reglas ya movidas al back:

- vacunas vigentes
- vacunas proximas a vencer
- vacunas pendientes
- deduplicacion por vacuna usando la aplicacion mas reciente
- calculo de `nextDueDate` y `daysUntilDue`

### Desparasitacion

Endpoints usados:

- `GET /api/dogs/{id}/deworming`
- `POST /api/dogs/deworming`
- `DELETE /api/deworming/{id}`

Endpoint nuevo orientado a UI:

- `GET /api/dogs/{id}/deworming/overview`

Respuesta esperada:

```json
{
  "internalDeworming": {
    "type": "INTERNA",
    "current": {
      "id": 58,
      "name": "Milbemax",
      "administrationDate": "2026-03-01",
      "expirationDate": "2026-04-01",
      "type": "INTERNA"
    },
    "status": "WARNING",
    "daysUntilExpiration": 10,
    "canCreate": true
  },
  "externalDeworming": {
    "type": "EXTERNA",
    "current": null,
    "status": "MISSING",
    "daysUntilExpiration": null,
    "canCreate": true
  }
}
```

Reglas ya movidas al back:

- desparasitacion activa / warning / caducada / missing
- eleccion del registro actual por tipo
- calculo de dias hasta caducidad
- decision de si se puede crear o renovar

Estados posibles:

- `MISSING`
- `ACTIVE`
- `WARNING`
- `EXPIRED`

### Visitas veterinarias

Endpoints usados:

- `POST /api/veterinary-visits`
- `GET /api/veterinary-visits/{id}`
- `PUT /api/veterinary-visits/{id}`
- `DELETE /api/veterinary-visits/{id}`
- `POST /api/veterinary-visits/datatables`

DTO de detalle importante:

- `VeterinaryVisitViewDto` ahora devuelve:
  - `id`
  - `dogId`
  - `dogName`
  - `veterinaryId`
  - `veterinaryName`
  - `visitDate`
  - `reason`
  - `diagnosis`
  - `observations`

Motivo:

- el front ya no hace match del veterinario por `name`

### Tratamientos

Endpoints usados:

- `POST /api/veterinary-treatments`
- `GET /api/veterinary-treatments/{id}`
- `GET /api/veterinary-treatments/visit/{visitId}`
- `PUT /api/veterinary-treatments/{id}`
- `DELETE /api/veterinary-treatments/{id}`

Enum actual:

- `ORAL`
- `TOPICA`
- `INYECTABLE`

En front:

- el formulario usa un selector cerrado, no input libre

## Formato de fechas actual

JSON:

- visitas: ISO
- tratamientos: ISO
- vacunas aplicadas: ISO
- desparasitacion: ISO

Multipart:

- perro: `birthDate` ISO

Nota:

- si se anade un endpoint nuevo JSON con fechas, no volver a usar `dd-MM-yyyy` salvo que haya una razon fuerte

## Lo que ya no deberia hacerse

- no guardar `ownerId` en `localStorage`
- no volver a calcular estados de vacunas en Angular
- no volver a calcular estados de desparasitacion en Angular
- no reconstruir ids relacionados por nombre si el backend puede devolver el id
- no introducir conversiones manuales de fechas en cada componente si el DTO puede ser ISO

## Estado funcional actual

Implementado y operativo:

- login / register
- editar perfil
- home con lista de perros
- detalle de perro
- editar y borrar perro
- vacunas
- desparasitacion
- notas
- visitas veterinarias
- tratamientos
- veterinarios

## Riesgos o puntos pendientes

- `Notas` y `Visitas` siguen usando respuestas datatables basadas en `Map<String,String>`.
  - Funciona, pero no es un contrato REST especialmente limpio.
  - Si se quiere seguir limpiando la API, lo siguiente logico es sustituir eso por DTOs tipados.
- En una revision anterior el front etiquetaba `Veterinario` como opcional en visitas.
  - Revisar si el backend actual realmente permite `veterinaryId = null`.
  - Si no lo permite, el texto del front y la validacion deben alinearse.
- Hay muchos `getErrorMessage(...)` repetidos en Angular.
  - Se podria centralizar luego.

## Archivos especialmente importantes

Frontend:

- `src/app/pages/home/home.ts`
- `src/app/pages/profile/profile.ts`
- `src/app/pages/dog-detail/dog-detail.ts`
- `src/app/pages/dog-detail/dog-vaccines/dog-vaccines.ts`
- `src/app/pages/dog-detail/dog-deworming/dog-deworming.ts`
- `src/app/pages/dog-detail/dog-notes/dog-notes.ts`
- `src/app/pages/dog-detail/dog-visits/dog-visits.ts`
- `src/app/pages/veterinary-visit-form/veterinary-visit-form.ts`
- `src/app/pages/veterinary-treatment-form/veterinary-treatment-form.ts`
- `src/app/services/auth.ts`
- `src/app/services/owner.service.ts`
- `src/app/services/vaccine.service.ts`
- `src/app/services/deworming.service.ts`
- `src/app/services/veterinary-visit.service.ts`

Backend:

- `../pets/src/main/java/com/project/pets/controller/OwnerController.java`
- `../pets/src/main/java/com/project/pets/controller/DogController.java`
- `../pets/src/main/java/com/project/pets/service/impl/OwnerServiceImpl.java`
- `../pets/src/main/java/com/project/pets/domain/dto/OwnerProfileDto.java`
- `../pets/src/main/java/com/project/pets/domain/dto/OwnerProfileUpdateDto.java`
- `../pets/src/main/java/com/project/pets/service/impl/DogServiceImpl.java`
- `../pets/src/main/java/com/project/pets/service/impl/VeterinaryVisitServiceImpl.java`
- `../pets/src/main/java/com/project/pets/domain/dto/vaccine/VaccineOverviewDto.java`
- `../pets/src/main/java/com/project/pets/domain/dto/deworming/DewormingOverviewDto.java`
- `../pets/src/main/java/com/project/pets/domain/enums/CoverageStatus.java`

## Comandos utiles de validacion

Frontend:

```bash
cd /Users/joaquin/Documents/pets-front
./node_modules/.bin/tsc -p tsconfig.app.json --noEmit
```

Backend:

```bash
cd /Users/joaquin/Documents/pets
mvn -q -DskipTests compile
```

## Texto listo para pegar en una nueva conversacion

Pega esto en una conversacion nueva:

```text
Estoy trabajando en:
- Front: /Users/joaquin/Documents/pets-front
- Back: /Users/joaquin/Documents/pets

Antes de hacer nada, lee /Users/joaquin/Documents/pets-front/HANDOFF.md y usa ese documento como contexto principal.

Reglas importantes:
- No reintroduzcas ownerId en localStorage
- No vuelvas a mover al front la logica de vacunas o desparasitacion que ya esta en backend
- Mantén fechas ISO entre front y back
- Si una vista necesita un id relacionado, prefiere ampliar el DTO del backend antes que reconstruirlo por nombre
```
