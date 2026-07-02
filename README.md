# Obsidian-Like Tasks

Extensión de VS Code que porta el plugin [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) de Obsidian: gestiona tareas como checkboxes de markdown reales (`- [ ] ...`), directamente en tus notas, sin salir del editor.

> El nombre evita confundirse con la funcionalidad nativa "Tasks" de VS Code (`tasks.json`, *Tasks: Run Build Task*). Todos los comandos de esta extensión llevan el prefijo **"Obsidian-Like Tasks:"** en la Command Palette.

## Qué hace

- **Formato idéntico al de Obsidian**: `- [ ] Comprar leche 📅 2024-01-15 ⏫ 🔁 every week` — mismos emojis, mismas reglas de fecha/prioridad/recurrencia.
- **Alternar el estado de una tarea** con recurrencia: al completar una tarea recurrente, se crea automáticamente la siguiente ocurrencia con la fecha avanzada.
- **Crear o editar una tarea** mediante un asistente paso a paso (descripción, prioridad, fecha límite/programada/inicio, recurrencia) — acepta fechas relativas como "today" o "next monday".
- **CodeLens** ("Done" / "Edit" / regla de recurrencia) sobre cada línea de tarea en el editor.
- **Resaltado visual**: tachado para las tareas hechas, color rojo para las fechas vencidas.
- **Bloques de consulta** ` ```tasks ```, con una sintaxis muy cercana a la del plugin original:
  - Filtros: `not done`, `done`, `status.type is [not] <TIPO>`, `<due|scheduled|start|done|created|cancelled> before/after/on <fecha>`, `no/has <campo> date`, `priority is [above|below] <nivel>`, `path`/`description`/`tags`/`heading includes`, `description regex matches /patrón/flags`, `is [not] recurring`.
  - Combinadores: `(filtro A) OR (filtro B) AND NOT (filtro C)`, con paréntesis anidados.
  - Scripting: `filter by function <expresión JS>` y `group by function <expresión JS>` (con `task` en scope — puede devolver un array para agrupar una tarea en varios grupos a la vez).
  - `sort by <campo> [reverse]` (admite varias líneas como criterio de desempate) y `limit <n>`.
  - Se renderizan en la **Vista Previa de Markdown nativa de VS Code** (`Ctrl+Shift+V`), y también dentro del editor de la extensión "Vault Tool" (`angelCastro.vault-tool`) si está instalada.

## Comandos

| Comando | Qué hace |
|---|---|
| **Obsidian-Like Tasks: Toggle Task Done** | Alterna el estado de la tarea en la línea del cursor. Atajo por defecto: `Ctrl+Enter` en un archivo markdown. |
| **Obsidian-Like Tasks: Create or Edit Task** | Abre el asistente para crear una tarea nueva, o editar la de la línea del cursor si ya es una tarea. |

Ambos comandos también funcionan si el archivo está abierto con un editor personalizado de otra extensión (como Vault Tool) que sustituye al editor de texto nativo de VS Code — en ese caso, "Create or Edit Task" añade la tarea nueva al final del documento (sin una posición de cursor conocida, no hay forma de saber dónde insertarla en medio del texto).

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
- El orden por defecto de una query sin `sort by` es una aproximación (no completada / fecha límite / prioridad), no el cálculo real de "urgency" del plugin original.
- Sin filtros de dependencias entre tareas (`dependsOn`/`id`) en las queries.

Ver `CLAUDE.md` para el detalle técnico completo (arquitectura, decisiones de diseño, integración con Vault Tool).
