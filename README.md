# Obsidian-like Tasks

Extensión de VS Code que porta el plugin [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) de Obsidian: gestiona tareas como checkboxes de markdown reales (`- [ ] ...`), directamente en tus notas, sin salir del editor.

> El nombre evita confundirse con la funcionalidad nativa "Tasks" de VS Code (`tasks.json`, *Tasks: Run Build Task*).

## Qué hace

- **Formato idéntico al de Obsidian**: `- [ ] Comprar leche 📅 2024-01-15 ⏫ 🔁 every week` — mismos emojis, mismas reglas de fecha/prioridad/recurrencia.
- **Alternar el estado de una tarea** con recurrencia: al completar una tarea recurrente, se crea automáticamente la siguiente ocurrencia con la fecha avanzada.
- **Crear o editar una tarea** mediante un diálogo de una sola pantalla, estilo el modal "Create or edit Task" de Obsidian Tasks: descripción, prioridad, fecha límite/programada/inicio, recurrencia con vista previa en vivo, estado (desplegable), fechas de creación/hecho/cancelado, y dependencias "Before this"/"After this" con búsqueda entre todas las tareas del vault — acepta fechas relativas como "today" o "next monday".
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

Esta extensión no contribuye comandos a la Command Palette. Alternar o crear/editar una tarea se
hace desde:

- El **CodeLens** ("Done" / "Edit") que aparece sobre cada línea de tarea en el editor nativo de
  VS Code.
- Si tienes instalada la extensión "Obsidian-like" (`angelCastro.obsidian-like`), su propio atajo
  `Shift+Alt+E` ("Obsidian-like: Editar tarea en el cursor") — funciona tanto con el editor nativo
  como con el suyo propio, ya que sabe resolver el cursor en ambos casos.

(Esta extensión sí tuvo antes dos comandos con atajo propio resueltos contra el cursor del editor
nativo — se eliminaron al confirmarse que el atajo de Obsidian-like los cubre igual o mejor, sin
la limitación de solo funcionar en el editor nativo. Editar una tarea concreta desde un editor
personalizado como el de Obsidian-like requiere que **esa** extensión resuelva su propio cursor
—solo ella lo conoce— y llame a la API pública `editTaskAtLocation`, ver más abajo.)

## Integración con otras extensiones

Esta extensión expone una API pública (`vscode.extensions.getExtension('angelCastro.obsidian-like-tasks')?.exports`) para que otra extensión con su propio editor de notas — como "Obsidian-like" (`angelCastro.obsidian-like`) — delegue en el motor de tareas de esta extensión en vez de reimplementarlo:

- `toggleTaskLine(lineText)` / `toggleTaskAtLocation(path, line)` — alternan el estado de una tarea (con recurrencia).
- `editTaskAtLocation(path, line)` — abre el diálogo "Create or edit Task" para la tarea en esa ubicación exacta, y aplica el resultado. Pensado para editores que no exponen su cursor a VS Code (como un `CustomTextEditorProvider` ajeno): en vez de depender de la posición del cursor, se le dice explícitamente qué tarea editar.
- `renderTasksQuery(queryText)` — ejecuta una query ` ```tasks ``` ` contra todo el vault y devuelve los resultados como datos (no HTML), para que el llamador los renderice con su propio estilo.
- `onDidChangeTasks` — evento que se dispara cuando cualquier tarea del workspace cambia, para refrescar vistas.

Es una dependencia **opcional**: si esta extensión no está instalada, el llamador debe degradar con normalidad (Obsidian-like, por ejemplo, cae a un toggle simple `[ ]`↔`[x]` sin recurrencia).

## Requisitos

- Ninguno para el CodeLens de toggle/crear/editar tarea sobre el archivo abierto: funciona incluso sin una carpeta abierta como workspace.
- Para los bloques ` ```tasks ``` (que consultan tareas de **todo el vault**, no solo el archivo actual) hace falta tener una **carpeta abierta como workspace** — sin ella no hay nada que indexar.

## Instalación (local, sin Marketplace)

```bash
npm install --strict-ssl=false   # si hay problemas de SSL corporativo
npm run package                  # genera obsidian-like-tasks-<versión>.vsix
code --install-extension obsidian-like-tasks-<versión>.vsix
```

Para depurar: abrir esta carpeta en VS Code y pulsar **F5** (lanza un Extension Development Host).

## Seguridad y privacidad

Esta extensión no hace ninguna llamada de red por sí misma: sin telemetría, sin analítica, sin
"phone home" de ningún tipo. Verificado revisando todo `src/`, el compilado `out/`, y sus tres
únicas dependencias en tiempo de ejecución (`chrono-node`, `moment`, `rrule`) en busca de
`fetch`/`XMLHttpRequest`/`http(s).request`/`WebSocket`/`child_process` y de cualquier SDK de
telemetría — nada de eso aparece en ningún sitio. El diálogo "Create or edit Task" (el único
webview de la extensión) además tiene una CSP estricta (`default-src 'none'`), así que ni siquiera
permite cargar nada externo aunque algo lo intentara.

**Salvedad**: `filter by function <expresión JS>` / `group by function <expresión JS>` en un
bloque ` ```tasks ``` ` evalúa esa expresión con `new Function(...)` en el contexto Node.js
completo del extension host, sin sandboxing — es un port deliberado de la misma funcionalidad de
scripting del plugin original de Obsidian (ver el docstring de `ScriptingTaskView.ts`). Esto
significa que ese código sí podría, en principio, hacer llamadas de red o ejecutar comandos —
pero solo a partir de contenido que ya está en un fichero abierto de tu propio workspace, nunca
desde entrada de red externa. El riesgo real es abrir una bóveda sincronizada desde una fuente no
confiable (una plantilla descargada, un vault compartido) cuyo bloque `tasks` contenga una
expresión de este tipo.

## Limitaciones conocidas frente al plugin original

- No hay UI de configuración (los ajustes de comportamiento — fechas automáticas al completar, orden de recurrencia, etc. — usan los valores por defecto de Obsidian Tasks, fijos en código).
- No hay soporte para statuses *verdaderamente* personalizados con nombre propio más allá de los seis registrados por defecto: Todo, In Progress, Done, Cancelled, Waiting (`w`) y Delegated (`d`).
- El orden por defecto de una query sin `sort by` es una aproximación (no completada / fecha límite / prioridad), no el cálculo real de "urgency" del plugin original — no hay `sort by function` ni `urgency` como criterio.
- `hide`/`show <campo>` se aceptan pero no ocultan nada todavía (el renderer siempre muestra el mismo conjunto de badges).
- El placeholder `{{query.file.path}}` (típico en `path does not include {{query.file.path}}`) no se expande — se compara como texto literal.

Ver `CLAUDE.md` para el detalle técnico completo (arquitectura, decisiones de diseño, integración con Obsidian-like).
