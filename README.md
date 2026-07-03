# Obsidian-Like Tasks

Extensión de VS Code que porta el plugin [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) de Obsidian: gestiona tareas como checkboxes de markdown reales (`- [ ] ...`), directamente en tus notas, sin salir del editor.

> El nombre evita confundirse con la funcionalidad nativa "Tasks" de VS Code (`tasks.json`, *Tasks: Run Build Task*). Todos los comandos de esta extensión llevan el prefijo **"Obsidian-Like Tasks:"** en la Command Palette.

## Qué hace

- **Formato idéntico al de Obsidian**: `- [ ] Comprar leche 📅 2024-01-15 ⏫ 🔁 every week` — mismos emojis, mismas reglas de fecha/prioridad/recurrencia.
- **Alternar el estado de una tarea** con recurrencia: al completar una tarea recurrente, se crea automáticamente la siguiente ocurrencia con la fecha avanzada.
- **Crear o editar una tarea** mediante un diálogo de una sola pantalla, estilo el modal "Create or edit Task" de Obsidian Tasks (descripción, prioridad, fecha límite/programada/inicio, recurrencia con vista previa en vivo) — acepta fechas relativas como "today" o "next monday".
- **CodeLens** ("Done" / "Edit" / regla de recurrencia) sobre cada línea de tarea en el editor.
- **Resaltado visual**: tachado para las tareas hechas, color rojo para las fechas vencidas.
- **Bloques de consulta** ` ```tasks ```, con una sintaxis muy cercana a la del plugin original:
  - Filtros: `not done`, `done`, `status.type is [not] <TIPO>`, `<due|scheduled|start|done|created|cancelled> before/after/on <fecha>`, `no/has <campo> date`, `happens before/after/on <fecha>` / `has/no happens date` (due, scheduled o start a la vez), `has/no depends on`, `has/no id`, `priority is [above|below] <nivel>`, `path`/`description`/`tags`/`heading includes`, `description regex matches /patrón/flags`, `is [not] recurring`.
  - Combinadores: `(filtro A) OR (filtro B) AND NOT (filtro C)`, con paréntesis anidados.
  - Scripting: `filter by function <expresión JS>` y `group by function <expresión JS>` (con `task` en scope — puede devolver un array para agrupar una tarea en varios grupos a la vez).
  - `sort by <campo> [reverse]` (admite varias líneas como criterio de desempate), `limit <n>`, y `hide`/`show <campo>` (aceptadas pero sin efecto — el renderer no tiene aún toggles de columnas).
  - Se renderizan en la **Vista Previa de Markdown nativa de VS Code** (`Ctrl+Shift+V`), y también dentro del editor de la extensión "Obsidian-like" (`angelCastro.obsidian-like`) si está instalada.
- **Estilizado enriquecido de líneas de tarea sueltas** (fuera de bloques ` ```tasks ```) en la Vista Previa de Markdown: icono distinto por estado para símbolos no estándar (`/`, `-`, y cualquier otro más allá de espacio/`x`), tachado solo en cancelada/completada, y `#tags` como pills de color — igual que hace Obsidian con cualquier checkbox de una nota, no solo dentro de una query.

## Comandos

| Comando | Qué hace |
|---|---|
| **Obsidian-Like Tasks: Toggle Task Done** | Alterna el estado de la tarea en la línea del cursor. Atajo por defecto: `Ctrl+Enter` en un archivo markdown. |
| **Obsidian-Like Tasks: Create or Edit Task** | Abre el diálogo para crear una tarea nueva, o editar la de la línea del cursor si ya es una tarea. |

Ambos comandos también funcionan si el archivo está abierto con un editor personalizado de otra extensión (como Obsidian-like) que sustituye al editor de texto nativo de VS Code — en ese caso VS Code no expone una posición de cursor, así que "Create or Edit Task" avisa con un mensaje y añade la tarea nueva al final del documento en vez de editar una existente. Para editar una tarea concreta desde un editor personalizado, esa extensión debe llamar a la API pública (`editTaskAtLocation`, ver más abajo) con la ubicación exacta — es lo que hace Obsidian-like con el botón ✏️ junto a cada checkbox.

## Integración con otras extensiones

Esta extensión expone una API pública (`vscode.extensions.getExtension('angelCastro.obsidian-like-tasks')?.exports`) para que otra extensión con su propio editor de notas — como "Obsidian-like" (`angelCastro.obsidian-like`) — delegue en el motor de tareas de esta extensión en vez de reimplementarlo:

- `toggleTaskLine(lineText)` / `toggleTaskAtLocation(path, line)` — alternan el estado de una tarea (con recurrencia).
- `editTaskAtLocation(path, line)` — abre el diálogo "Create or edit Task" para la tarea en esa ubicación exacta, y aplica el resultado. Pensado para editores que no exponen su cursor a VS Code (como un `CustomTextEditorProvider` ajeno): en vez de depender de la posición del cursor, se le dice explícitamente qué tarea editar.
- `renderTasksQuery(queryText)` — ejecuta una query ` ```tasks ``` ` contra todo el vault y devuelve los resultados como datos (no HTML), para que el llamador los renderice con su propio estilo.
- `onDidChangeTasks` — evento que se dispara cuando cualquier tarea del workspace cambia, para refrescar vistas.

Es una dependencia **opcional**: si esta extensión no está instalada, el llamador debe degradar con normalidad (Obsidian-like, por ejemplo, cae a un toggle simple `[ ]`↔`[x]` sin recurrencia).

## Requisitos

- Ninguno para usar los comandos de toggle/crear/editar tarea sobre el archivo abierto: funcionan incluso sin una carpeta abierta como workspace.
- Para los bloques ` ```tasks ``` (que consultan tareas de **todo el vault**, no solo el archivo actual) hace falta tener una **carpeta abierta como workspace** — sin ella no hay nada que indexar.

## Instalación (local, sin Marketplace)

```bash
npm install --strict-ssl=false   # si hay problemas de SSL corporativo
npm run package                  # genera obsidian-like-tasks-<versión>.vsix
code --install-extension obsidian-like-tasks-<versión>.vsix
```

Para depurar: abrir esta carpeta en VS Code y pulsar **F5** (lanza un Extension Development Host).

## Limitaciones conocidas frente al plugin original

- No hay UI de configuración (los ajustes de comportamiento — fechas automáticas al completar, orden de recurrencia, etc. — usan los valores por defecto de Obsidian Tasks, fijos en código).
- No hay soporte para statuses personalizados con nombre propio (p. ej. "Delegated") más allá de los básicos (Todo, In Progress, Done, Cancelled).
- El orden por defecto de una query sin `sort by` es una aproximación (no completada / fecha límite / prioridad), no el cálculo real de "urgency" del plugin original — no hay `sort by function` ni `urgency` como criterio.
- `hide`/`show <campo>` se aceptan pero no ocultan nada todavía (el renderer siempre muestra el mismo conjunto de badges).
- El placeholder `{{query.file.path}}` (típico en `path does not include {{query.file.path}}`) no se expande — se compara como texto literal.

Ver `CLAUDE.md` para el detalle técnico completo (arquitectura, decisiones de diseño, integración con Obsidian-like).
