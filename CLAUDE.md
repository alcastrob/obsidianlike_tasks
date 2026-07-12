# obsidianlike_tasks

## Qué es este repositorio

Contiene dos cosas:

- **La raíz del repo** (`package.json`, `tsconfig.json`, `src/`, ...) — extensión de VS Code para gestión de tareas, estilo Obsidian Tasks. **Este es el proyecto activo.**
- **`obsidian-tasks-code/`** — código fuente del plugin [Obsidian Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) (subido como referencia/inspiración, no se compila ni se toca).

**Nota histórica**: hasta hace poco los fuentes de la extensión vivían en una subcarpeta
`vscode-extension/` (monorepo con dos proyectos hermanos). Esa subcarpeta se eliminó y su
contenido se movió a la raíz del repo — el repo *es* la extensión ahora, con
`obsidian-tasks-code/` como único hermano (referencia). Si algo en git history o en apuntes
viejos menciona rutas `vscode-extension/...`, tradúcelas mentalmente a la raíz.

## La extensión

### Objetivo

Extensión de VS Code llamada **"Obsidian-like Tasks"** que permite crear, completar y eliminar tareas directamente desde el editor, sin salir al navegador ni a otra app. Inspirada en el plugin Tasks de Obsidian. El nombre evita confundirla con la funcionalidad nativa de VS Code "Tasks" (`tasks.json`, `Tasks: Run Build Task`, etc.) — por eso todos los comandos de esta extensión llevan el prefijo `Obsidian-like Tasks:` en la Command Palette.

**Identificador interno**: `package.json`'s `name` es `obsidian-like-tasks` (sin relación con el nombre de la carpeta del repo, `obsidianlike_tasks`), así que el id de extensión es `angelCastro.obsidian-like-tasks`. Obsidian-like (`c:\git\obsidianlike\src\extension.ts`, función `getTasksApi()`) depende de este id exacto como dependencia opcional (`vscode.extensions.getExtension('angelCastro.obsidian-like-tasks')`) — si vuelve a cambiar `name`, hay que actualizarlo también ahí y en `c:\git\obsidianlike\CLAUDE.md`.

### Stack

- TypeScript (`^5.4.0`), compilado a CommonJS ES2020
- VS Code Extension API (`^1.85.0`)
- `moment` / `rrule` / `chrono-node` — motor de fechas y recurrencia (dependencias reales en
  tiempo de ejecución; ver el gotcha de `.vscodeignore` más abajo)
- `@vscode/vsce` (`^3.0.0`) — para empaquetar en `.vsix`

### Estructura de archivos

```
obsidianlike_tasks/            ← raíz del repo == raíz de la extensión
├── package.json              ← manifest (comandos, configuración)
├── README.md                 ← documentación de cara al usuario (qué hace, comandos, instalación)
├── tsconfig.json             ← CommonJS, ES2020, outDir=out, rootDir=src, esModuleInterop
├── .vscodeignore
├── src/
│   ├── extension.ts              ← activate()/deactivate(); activate() es async (espera al
│   │                                escaneo inicial) y devuelve la TasksExtensionApi completa
│   │                                (ver "Fase 2" más abajo)
│   ├── TaskIndex.ts              ← escanea/vigila *.md del workspace, cachea Task[] parseadas
│   ├── TaskCodeLensProvider.ts   ← CodeLens "Done/Edit" sobre cada línea de tarea
│   ├── TaskDecorations.ts        ← tachado de completadas + resaltado de vencidas
│   ├── markdownTasksPlugin.ts    ← markdown-it: renderiza bloques ```tasks``` + estiliza líneas
│   │                                de checkbox sueltas (iconos de estado, tags) en el Preview
│   ├── commands/taskCommands.ts  ← toggle / crear-editar tarea (delega el formulario en
│   │                                TaskEditWebview.ts)
│   ├── TaskEditWebview.ts        ← diálogo "Create or edit Task" (WebviewPanel), estilo Obsidian
│   ├── api/TasksApi.ts           ← API pública exportada (consumida por Obsidian-like)
│   └── core/                     ← port fiel del motor de Obsidian Tasks (ver abajo)
├── out/                      ← JS compilado (generado, no commitear)
└── obsidian-tasks-code/      ← plugin original de Obsidian, solo como referencia — no se compila
                                 (tsconfig.json tiene `"include": ["src/**/*"]` precisamente para
                                 que tsc no intente compilar esto, ahora que es hermano de `src/`)
```

Las tareas son líneas markdown reales (`- [ ] texto 📅 2024-01-01 ⏫ 🔁 every week`) en
cualquier `.md` del workspace, parseadas con las mismas expresiones regulares y el mismo
formato de emojis que el plugin original de Obsidian.

**Nota histórica**: hubo una primera versión de esta extensión con un gestor de tareas
independiente en JSON (`TaskProvider.ts`/`TaskItem.ts`/`models/Task.ts`, vista de árbol propia
en el Explorer, comandos `tasksManager.addTask/toggleTask/deleteTask/refresh`), sin relación
con el formato de Obsidian Tasks. Se eliminó por completo porque coexistir con el motor real
generaba confusión (dos comandos de nombre parecido con comportamiento distinto). No queda
rastro en el código; si se necesita esa referencia, está en el historial de git.

### `core/` — motor portado de `obsidian-tasks-code/src/`

Casi todos los ficheros bajo `core/` son un port directo (algoritmos y nombres de campos
idénticos) de los correspondientes en `obsidian-tasks-code/src/`, con dos recortes deliberados
frente al original, documentados con comentarios `MAINTENANCE`/docstring en cada fichero:

- Sin jerarquía `ListItem` (padre/hijos) ni caché de frontmatter/outlinks de Obsidian — `Task`
  es una clase plana, no hereda de `ListItem`. `TaskLocation` es solo `{ path, lineNumber, ... }`,
  sin el wrapper `TasksFile`.
- `Config/Settings.ts` es un stub con los valores por defecto reales de Obsidian Tasks
  (`setDoneDate: true`, `recurrenceOnNextLine: false`, etc.), no una UI de configuración.

Todo lo demás (parsing, serialización a emojis, máquina de estados de `toggle()`/recurrencia
vía `rrule`, motor de queries) se comporta igual que el original — verificado con pruebas de
humo manuales (parseo, round-trip, `toggle()` con recurrencia, filtros/orden/agrupación de
queries) antes de dar cada pieza por cerrada.

| Módulo | Rol |
|---|---|
| `core/Task/Task.ts` | Clase `Task`: parseo (`fromLine`), serialización, `toggle()`/recurrencia |
| `core/TaskSerializer/DefaultTaskSerializer.ts` | Formato de emojis por defecto (📅⏳🛫✅❌🔁⏫🔼🔽⏬🆔⛔🏁➕) |
| `core/Statuses/` | `Status`, `StatusConfiguration`, `StatusRegistry` (TODO→DONE, IN_PROGRESS, etc.) |
| `core/Task/Recurrence.ts` / `Occurrence.ts` | Reglas de recurrencia vía `rrule`, cálculo de la siguiente fecha |
| `core/Query/Query.ts` | Lenguaje de queries — ver detalle abajo. **No** es el motor completo de ~50 ficheros del original (sin `urgency`, sin UI de settings para statuses personalizados); ver comentario en el fichero |
| `core/Query/DateParsing.ts` | Fechas absolutas (`YYYY-MM-DD`) y relativas (`today`, `next monday`) vía `chrono-node` |
| `core/Query/ScriptingTaskView.ts` / `TasksDate.ts` | El objeto `task` expuesto dentro de expresiones `filter by function` / `group by function` |

### `core/Query/Query.ts` — qué soporta

Cada línea que no es `sort by`/`group by`/`limit` se parsea como una **expresión booleana**
(`parseBooleanExpression`): paréntesis anidados + `AND`/`OR`/`NOT` combinando cualquiera de los
filtros atómicos (`parseFilterAtom`), no solo una lista plana de líneas en AND implícito como en
la versión inicial. Verificado contra 6 queries reales de un vault de Obsidian (no solo casos
de prueba inventados) — ver `git log`/conversación para los ejemplos exactos.

Filtros atómicos soportados: `not done`/`done`, `status.type is [not] <TYPE>` (TODO,
IN_PROGRESS, DONE, CANCELLED, ON_HOLD, NON_TASK — statuses **personalizados** con nombre propio
como "Delegated" no tienen UI de configuración todavía, así que su `.type` seguirá siendo TODO a
menos que se registren a mano), `<due|scheduled|start|done|created|cancelled> before/after/on
<fecha>` (acepta tanto `start` como `starts`, igual que Obsidian), `no/has <campo> date`,
`happens before/after/on <fecha>` / `has/no happens date` (pseudo-campo que mira due, scheduled
y start a la vez, igual que `HappensDateField` del original — útil para queries tipo `(happens
before tomorrow) OR (no due date)`), `has/no depends on`, `has/no id`, `priority is
[above|below] <nivel>`, `path includes/does not include`, `description includes/does not
include`, **`description regex matches /patrón/flags`**, `tags include/do not include`, `no
tags`, `heading includes`, `is [not] recurring`, y **`filter by function <expresión JS>`**
(evalúa código arbitrario con `task` en scope — ver el aviso de seguridad en
`ScriptingTaskView.ts`: es contenido del propio vault del usuario, no entrada externa, pero es
ejecución de código real).

`hide <campo>` / `show <campo>` se reconocen (contra la misma lista de nombres que el original:
`id`, `depends on`, `priority`, fechas, `tags`, `backlink`, `edit button`, `postpone button`,
`task count`, `toolbar`, `tree`, `urgency`, `on completion`, `recurrence rule`) pero son
**no-op** — `markdownTasksPlugin.ts` renderiza siempre el mismo conjunto fijo de badges (prioridad,
fecha de vencimiento, recurrencia, ruta) y no tiene todavía toggles por campo. El propósito de
reconocerlas es solo no reportarlas como "línea no reconocida"; un nombre de campo inventado
(`hide foobar`) sigue detectándose como tal.

**Limitación conocida, no arreglada todavía**: el placeholder `{{query.file.path}}` (típico en
`path does not include {{query.file.path}}` para excluir la nota que contiene la query) **no**
se expande — se compara como texto literal, así que ese filtro nunca excluye nada y la query
devuelve más resultados de los esperados, sin avisar con una línea no reconocida. Arreglarlo
requiere pasar la ruta del fichero que contiene el bloque ` ```tasks ``` ` hasta `TasksQuery`
(hoy ni `registerTasksCodeBlock` en `markdownTasksPlugin.ts` ni `renderTasksQuery` en
`TasksApi.ts` la reciben) — pendiente.

`sort by <campo> [reverse]` acepta múltiples líneas (se aplican en orden, como criterio de
desempate). `group by <campo>` soporta los campos nombrados de siempre, y **`group by function
<expresión JS>`**, que puede devolver un array para que una tarea aparezca en varios grupos a la
vez (p. ej. `task.tags.map(...)`) — igual que el original.

**Limitación heredada del propio Obsidian Tasks, no introducida aquí**: `TaskRegularExpressions.hashTags`
corta un tag en el primer espacio, así que un tag `#[[Project Uno]]` con espacio se parsea como
`#[[Project` (pierde " Uno]]"). Si usas `group by function task.tags.map(tag =>
tag.replace('#[[', ''))` sobre tags con espacios dentro de `#[[...]]`, los nombres de grupo
saldrán truncados — es fiel al comportamiento del plugin original, no un bug de este port.

### Funcionalidades implementadas

| Feature | Dónde |
|---|---|
| **Toggle de tarea markdown bajo el cursor** (con recurrencia) | comando `tasksManager.toggleTaskLine` (`Ctrl+Enter` en markdown) |
| **Crear/editar tarea markdown** (descripción, prioridad, fechas, recurrencia) en un diálogo de una sola pantalla, estilo el modal "Create or edit Task" de Obsidian Tasks | comando `tasksManager.createOrEditTask` → `TaskEditWebview.ts` (`WebviewPanel`) — ver detalle abajo |
| **CodeLens "Done / Edit / 🔁 regla"** sobre cada línea de tarea | `TaskCodeLensProvider` |
| **Tachado de completadas + fecha vencida en rojo** en el editor | `TaskDecorations` |
| **Bloques ` ```tasks ` renderizados en el Preview de Markdown** integrado de VS Code | `markdownTasksPlugin.ts` + `contributes.markdown.markdownItPlugins` |
| **Estilizado de líneas de checkbox sueltas** (fuera de bloques ` ```tasks `) en el Preview: icono por estado para símbolos no estándar, tachado solo en cancelada/completada, `#tags` como pills de color | `markdownTasksPlugin.ts` (`registerRawTaskLineStyling`) + `media/tasks-preview.css` — ver detalle abajo |
| Índice de tareas de todo el workspace, actualizado al vuelo | `TaskIndex` (escaneo inicial + `FileSystemWatcher` + debounce de ediciones) |

### `markdownTasksPlugin.ts` — estilizado de líneas de checkbox sueltas

En Obsidian, el plugin Tasks no solo renderiza bloques ` ```tasks ` — en la vista de lectura
también post-procesa **cualquier** línea `- [ ] ...` de cualquier nota, dando a cada símbolo de
estado (no solo espacio/`x`) un icono distinto y coloreando los `#tags` como pills. El Preview de
Markdown integrado de VS Code tiene su propio renderizado nativo de checkboxes (un `<input
type="checkbox">` real, sin relación con esta extensión), pero solo distingue "marcado"/"no
marcado" — un símbolo como `[/]` (en curso) o `[w]` (un estado propio del usuario) colapsa al
mismo estado binario que `[ ]`/`[x]`, y para cuando el HTML ya existe el carácter original se ha
perdido, así que no hay forma de recuperarlo desde el DOM después de renderizar.

El único punto fiable para interceptar es el **markdown fuente**, antes de que la regla de
checkbox de VS Code (la que sea, no la implementa esta extensión) vea el `[x]`. Por eso
`registerRawTaskLineStyling(md)`:

1. Registra una regla `core` (`md.core.ruler.after('normalize', ...)`) que reescribe, línea a
   línea, el corchete `[symbol]` de cualquier tarea con estado *no* estándar (es decir, distinto
   de `[ ]`/`[x]`/`[X]`, que el checkbox nativo de VS Code ya renderiza bien) por un marcador
   inerte (caracteres de la zona de uso privado Unicode, rango U+E050-U+E053, invisibles e
   ignorados por markdown-it) — esto ocurre **antes** de que exista ningún token, así que no
   importa qué regla de checkbox tenga registrada VS Code ni en qué orden. Detecta y salta
   bloques de código con fences (` ``` `/`~~~`, incluidos los ` ```tasks `) para no confundir su
   contenido con tareas reales.
2. Registra una regla `inline` (`md.inline.ruler.before('text', ...)`) para `#tags`, que sí puede
   ser una regla normal porque `#` ya es un carácter terminador de la regla `text` de
   markdown-it — de modo que backticks/enlaces/wikilinks (que consumen su span completo antes de
   que la regla de texto llegue a los caracteres internos) protegen automáticamente cualquier
   `#` dentro de código o `[[Nota#Ancla]]` sin lógica adicional. Aplica en todo el documento, no
   solo en líneas de tarea, igual que el coloreado de tags nativo de Obsidian.
3. Envuelve `renderer.render`/`renderer.renderInline` para sustituir los marcadores por el HTML
   final (icono de estado, o `<span class="tasks-cancelled-text">` envolviendo el resto de la
   línea para `-`/Cancelled) una vez generada la cadena completa.

El mapa de iconos (`STATUS_ICON_EMOJI`) cubre `/` (🔄, En curso), `w` (⏳, En espera), `d` (👤,
Delegada) y `-` (✖, Cancelada) — el conjunto completo de 6 estados que esta extensión soporta,
junto con `⚪`/`✅` para `[ ]`/`[x]` (ambos dejados al checkbox nativo de VS Code, no a un icono
propio). Cualquier otro símbolo cae a una insignia genérica con el carácter tal cual, en vez de
inventar un icono para un estado que esta extensión aún no tiene UI para registrar (ver el gotcha
de `Config/Settings.ts` más abajo). Los estilos (pills de tags con color determinista por hash del
texto, tachado atenuado, `accent-color` verde para el checkbox nativo marcado) están en
`media/tasks-preview.css`, contribuido vía `contributes.markdown.previewStyles`.

**Alineación icono-de-estado vs checkbox nativo**: un emoji a color (🔄✖⏳👤) se renderiza
sensiblemente más grande que el `<input type="checkbox">` nativo al mismo `font-size` — sin una
caja explícita compartida, una lista con líneas de distinto estado quedaba con iconos de tamaño y
padding inconsistentes entre sí y respecto al checkbox (comprobado renderizando una muestra real
con markdown-it + Chrome headless, no solo a ojo). `input[type='checkbox']` y `.tasks-status-icon`
comparten ahora una caja fija (`1.15em` × `1.15em`, `inline-flex` centrado); el icono reduce su
`font-size` a `0.7em` con `overflow: hidden` para que el glifo (más grande que su caja) quede
recortado en vez de desbordar. `.tasks-status-icon-unknown` (símbolos sin icono conocido) sigue
siendo la excepción con su propia píldora de tamaño variable.

**Fechas sin estilo de "badge"**: en el listado de un bloque ` ```tasks ` (`renderTaskLine`), la
fecha de vencimiento ya no lleva la clase `tasks-badge` — antes se veía en un color/tamaño
distinto del resto de la tarea (píldora con fondo, `font-size: 0.85em`); ahora es texto plano con
el mismo tipo/color/peso que la descripción, conservando solo el rojo+negrita cuando está vencida.
Prioridad y recurrencia siguen como badge (no se pidió cambiarlas).

### `TaskEditWebview.ts` — diálogo "Create or edit Task"

VS Code no tiene API para un modal flotante con HTML propio (a diferencia del Svelte modal del
plugin original) — lo más parecido es un `WebviewPanel`, que se abre como una pestaña del editor,
no como overlay centrado. `showTaskEditDialog()` lo aproxima con una "card" centrada sobre fondo
oscurecido dentro de esa pestaña, replicando el layout del modal de Obsidian Tasks (rejilla de
prioridad 3×2, una fila por fecha con icono + input de texto en lenguaje natural + `<input
type="date">` nativo como atajo, texto de vista previa de la recurrencia en cursiva). Se abre con
`{ viewColumn: vscode.ViewColumn.Beside, preserveFocus: false }` — no `ViewColumn.Active` (probado
primero): ese sustituye la pestaña activa en el mismo grupo, así que el documento que se estaba
editando desaparecía detrás del diálogo (un grupo de pestañas solo muestra una a la vez).
`ViewColumn.Beside` abre una columna dividida junto a la actual, dejando el documento visible — lo
más cerca que permite `WebviewPanel` de un modal flotante real. Al cargar, el foco se pone en el
`<textarea>` de la descripción con el cursor al final del texto (`descriptionEl.focus()` +
`setSelectionRange`, al final del `<script>` del webview), para poder empezar a escribir sin un
clic previo.

Cubre el mismo conjunto de campos que el modal Svelte original: descripción, prioridad,
recurrencia, due/scheduled/start, **Before this**/**After this** (dependencias), **Status**
(desplegable de estados registrados) y **Created**/**Done**/**Cancelled**. La única pieza que
sigue sin puerto es un editor de `On Completion` — se preserva tal cual venía de la tarea existente
(`existing?.onCompletion ?? OnCompletion.Ignore` en `promptForTaskFields`), sin UI propia todavía.

Toda la validación (fechas vía `parseQueryDate`, regla de recurrencia vía `Recurrence.fromText`)
ocurre en el **extension host**, no en el webview — `chrono-node`/`rrule` no están bundleados para
el navegador del webview. El webview solo envía texto crudo por `postMessage` (`apply`,
`previewRecurrence` con debounce de 250 ms mientras se escribe, `statusChanged`,
`searchDependency`, `cancel`); si algo no parsea, la extensión responde con `{ type: 'error' }` y
el diálogo se queda abierto mostrando el mensaje, sin cerrarse. La descripción (y cualquier otro
texto libre) se incrusta en el HTML vía `JSON.stringify`, con los signos "menor que"
adicionalmente escapados a una secuencia unicode literal — evita que un `</script>` presente
dentro de la descripción de una tarea cierre la etiqueta `<script>` antes de tiempo.

**Status** (`status.svelte`'s `StatusEditor` equivalente): el desplegable se rellena con
`StatusRegistry.getInstance().registeredStatuses` (por defecto solo TODO/IN_PROGRESS/DONE/
CANCELLED — ver el gotcha de `Config/Settings.ts`/statuses personalizados en la sección de
`core/Query/Query.ts`). Al cambiar de estado, el webview manda `statusChanged` (símbolo elegido +
el texto actual de Done/Cancelled) y el extension host responde `statusDatesUpdated` calculado
contra una `baselineTask` fija (la tarea existente, o una TODO recién creada si se está creando una
tarea) vía `baselineTask.handleNewStatus(newStatus)` — mismo cálculo que
`StatusEditor.svelte`/`setStatusRelatedDate` del original: solo pisa el campo de fecha si está
vacío (al entrar en ese estado) o lo vacía si estaba relleno pero el nuevo estado ya no aplica;
si el usuario ya escribió algo a mano, se respeta.

**Before this / After this** (`Dependency.svelte` equivalente): el webview no tiene acceso al
índice de tareas del workspace, así que la búsqueda (`searchDependency` → `dependencyResults`) la
resuelve el extension host contra `context.allTasks` (un snapshot de `TaskIndex.getAllTasks()`
tomado al abrir el diálogo) usando `DependencySearch.ts` — una aproximación propia de scoring
por subcadena/subsecuencia, ya que aquí no hay vault de Obsidian del que tirar de
`prepareSimpleSearch`. Cada candidato viaja como `{ key: "path#line", description, path,
statusSymbol }`; `key` es la identidad usada tanto para excluir ya-seleccionados como para
resolver la selección final de vuelta a un `Task` real al pulsar Apply. `promptForTaskFields`
hace el resto (equivalente a `EditableTask.applyEdits` del original):
- Para "Before this" (`dependsOn` de esta tarea), cada tarea seleccionada necesita un `id` —
  si no lo tiene, `ensureTaskHasId`/`generateUniqueId` (`core/Task/TaskDependency.ts`, port de
  `Task/TaskDependency.ts`) le asigna uno y `TaskFileEditor.replaceTaskWithTasks` lo escribe en
  su archivo (que puede no ser el que se está editando).
- Para "After this", son las *otras* tareas las que necesitan `dependsOn` apuntando al `id` de
  ésta — si esta tarea aún no tiene uno y el conjunto de "after this" cambió, se genera aquí. Se
  diferencia contra el `dependsOn`-inverso calculado al abrir el diálogo (tareas cuyo `dependsOn`
  ya incluía el id de ésta) para saber a qué archivos añadir/quitar el id vía
  `addDependencyToParent`/`removeDependency` + `replaceTaskWithTasks`.
- Solo entonces se construye la `Task` final y se le aplica la transición de estado real vía
  `handleNewStatusWithRecurrenceInUsersOrder` (con el `today` inferido de los campos Done/Cancelled
  tal como el usuario los dejó, igual que `EditableTask.inferTodaysDate`) — por lo que completar
  una tarea recurrente **desde el diálogo** (cambiando Status a Done) genera la siguiente
  ocurrencia igual que el comando de toggle. Por eso `promptForTaskFields`/`editTaskFromLineText`
  devuelven `Task[]` (no un único `Task`) y todos los llamantes (`createOrEditTaskOnLine`,
  `createTaskAppendedToDocument`, `TasksApi.editTaskAtLocation`) escriben esa lista completa.

`getAllTasks: () => Task[]` se pasa en cascada desde `extension.ts` (`() =>
taskIndex?.getAllTasks() ?? []`) hasta `promptForTaskFields`, incluida la vía
`TasksApi.editTaskAtLocation` — con workspace vacío o sin `TaskIndex`, es `[]` y los campos
Before this/After this simplemente se muestran deshabilitados (mismo mensaje que el original:
"Blocking and blocked by fields are disabled...").

### Comandos registrados

| ID | Descripción |
|---|---|
| `tasksManager.toggleTaskLine` | Alterna el estado de la tarea markdown activa: cursor en el editor nativo, o si el archivo está abierto con un editor personalizado (Obsidian-like), avisa de que no hay línea conocida |
| `tasksManager.createOrEditTask` | Crea o edita una tarea vía el diálogo webview de `TaskEditWebview.ts`. Con editor nativo, edita la línea del cursor; sin él (editor personalizado), avisa y añade una tarea nueva al final del documento — para editar una tarea real en ese caso, el editor personalizado debe llamar a `editTaskAtLocation` (ver "Fase 2") en vez de este comando |
| `tasksManager.toggleTaskAtLine` / `editTaskAtLine` | Variantes con `(uri, line)` explícitos, usadas por el CodeLens |

Ambos comandos (`toggleTaskLine`, `createOrEditTask`) resuelven el documento activo también
cuando está abierto con un editor personalizado como Obsidian-like (`resolveActiveMarkdownTarget()`
en `commands/taskCommands.ts`, vía `vscode.window.tabGroups` en vez de `activeTextEditor`, que
no existe para editores personalizados) — ver "Fase 2" más abajo para el porqué.

**Importante**: ninguno de los dos comandos tiene restricción `when` en `menus.commandPalette`
(se quitó explícitamente) — un `"when": "editorLangId == markdown"` ahí los ocultaría de la
Command Palette entera cuando el editor activo es uno personalizado, por el mismo motivo que
`activeTextEditor` no existe en ese caso.

### Atajos de teclado — por qué son dos implementaciones separadas, no una

`package.json`'s `contributes.keybindings` tiene `Ctrl+Enter` → `toggleTaskLine` y
`Shift+Alt+E` → `createOrEditTask`, ambos con `"when": "editorTextFocus && editorLangId ==
markdown"`. Ese `when` es *justo* lo que hace que ninguno de los dos se dispare cuando el editor
activo es el de Obsidian-like: `editorTextFocus` no existe para un `CustomTextEditorProvider`
ajeno (mismo gotcha de siempre), así que el atajo contribuido aquí simplemente no llega a
evaluarse como aplicable en ese contexto — no es que se dispare y falle, es que VS Code ni lo
considera.

**Historial de por qué el atajo cambió dos veces antes de llegar a `Shift+Alt+E`**:

1. La primera versión usaba `Ctrl+Shift+Enter`, que resultó ser el atajo *por defecto* de VS
   Code para "Insert Line Above" (`editor.action.insertLineBefore`). En el editor nativo esto no
   daba problemas (una keybinding de extensión gana sobre la de VS Code para el mismo `when`),
   pero en el editor personalizado de Obsidian-like el síntoma fue que la tecla no hacía
   absolutamente nada — ni abría el diálogo ni el editor de CodeMirror la recibía siquiera —
   consistente con un comportamiento documentado de VS Code donde, para un
   `CustomTextEditorProvider`, la existencia de *cualquier* keybinding registrada para esa
   combinación de teclas (aunque su `when` no aplique) puede bastar para que la tecla se
   intercepte antes de llegar al webview, en vez de comprobarse contra el contexto real (ver
   issues de VS Code `microsoft/vscode#165777` y `microsoft/vscode#241801`).
2. Se cambió a `Ctrl+Alt+E` — sin choque con VS Code ni con ninguna extensión instalada — pero en
   un teclado en español (y otros layouts europeos con tecla AltGr: alemán, francés, italiano,
   portugués, escandinavos, eslavos...) `Ctrl+Alt+<letra>` es **físicamente indistinguible de
   AltGr+<letra>**: Windows/Chromium reportan AltGr como `ctrlKey=true, altKey=true` simultáneos,
   exactamente igual que si se hubiera pulsado Ctrl+Alt a mano. En un teclado español, AltGr+E
   compone el carácter `€`, así que pulsar "Ctrl+Alt+E" tecleaba un euro en vez de disparar el
   atajo — un problema que no aparece en un teclado US/UK (sin tecla AltGr) pero sí en cualquier
   layout con ella.
3. Se fijó `Shift+Alt+E`: ese combo nunca activa la composición de AltGr (que exige Ctrl+Alt
   simultáneos, no Shift+Alt), y se verificó igualmente contra la referencia oficial de atajos
   por defecto de VS Code y contra `~/.vscode/extensions/*/package.json` antes de fijarlo.

**Lección para cualquier atajo futuro pensado para un `CustomTextEditorProvider` de otra
extensión**: además de comprobar que no choque con VS Code ni con otras extensiones, evitar por
completo el patrón `Ctrl+Alt+<letra>` — o cualquier combo cuyos modificadores coincidan con los
de AltGr en el layout del usuario — y preferir `Ctrl+Shift+<letra>` o `Shift+Alt+<letra>`, que no
tienen ese problema en ningún layout conocido.

Se evaluó primero (y se descartó en un primer momento) la idea de que Obsidian-like publicara la
posición de su cursor a través de su propia API exportada
(`vscode.extensions.getExtension('angelCastro.obsidian-like')?.exports`, simétrico a como
Obsidian-like ya consume la de esta extensión) para que un atajo contribuido *por esta extensión*
pudiera consultarla bajo demanda, a favor de algo más simple: como el editor de Obsidian-like es
un webview con CodeMirror 6, un atajo de teclado que le interese capturar mientras tiene foco
puede resolverse enteramente **dentro de su propio `keymap.of([...])`** (igual que ya hace con
`Mod-b`/`Mod-i` para negrita/cursiva) — en ese punto el cursor ya es conocido localmente, sin
ningún salto entre extensiones.

Esa primera versión (un keymap de CodeMirror puro, sin tocar el sistema de keybindings de VS
Code) funcionaba, pero resultó insuficiente por un motivo que no se había contemplado: al no
pasar por `contributes.keybindings`, la Paleta de Atajos de Teclado de VS Code no sabía que
existía — no aparecía en la lista, y el usuario no podía reasignarlo a otra combinación. Para
algo tan central eso no era aceptable, así que Obsidian-like acabó implementando una versión
reducida de la idea inicialmente descartada: no una API pública nueva (nadie más la necesita),
sino un mensaje `cursor-position` que el webview manda en cada cambio de selección, cacheado en
un `Map` interno de `extension.ts`, más un comando real (`vaultTool.editTaskAtCursor`) con su
propio `contributes.keybindings` (mismo patrón `when` que ya usa `vaultTool.openNoteQuickPick`)
que lee esa caché en vez de `vscode.window.activeTextEditor`. Al ser una keybinding contribuida
de verdad, sí aparece y es reasignable en la UI de VS Code. Detalle completo en el `CLAUDE.md` de
`obsidianlike`, sección "Keyboard shortcut for 'edit task at cursor'". La idea original de una
API pública de cursor seguiría siendo la opción correcta si algún día una *tercera* extensión
(ni esta ni Obsidian-like) necesitara esa posición desde fuera del propio webview — no es este
caso, por eso se quedó en un mecanismo interno de Obsidian-like.

### Fase 2 — integración con Obsidian-like (implementada)

Obsidian-like (`c:\git\obsidianlike`) abre los `.md` con un `CustomTextEditorProvider` propio
(webview + CodeMirror 6), que **sustituye por completo** al editor de texto nativo de VS Code.
Esto significa que el `TaskCodeLensProvider` y `TaskDecorations` de esta extensión (fase 1) son
**invisibles** en cualquier nota abierta con Obsidian-like — solo se ven si el usuario abre el
fichero con "Open With → Text Editor". Además, dos extensiones no pueden inyectarse código una
en el webview de la otra (aislamiento total). Por eso la integración real tiene dos piezas
separadas, no "un hook compartido", coordinadas con un agente independiente trabajando
directamente sobre `c:\git\obsidianlike` (repo Git completamente separado, sin relación de
submódulo/worktree con este):

1. **Renderizado (dentro del webview de Obsidian-like, sin llamar a esta extensión):** detector de
   sintaxis de tareas propio (regex-only) en su `livePreviewPlugin`, reutilizando el manejo
   existente de nodos `ListItem`/`ListMark` para los checkboxes, y `FencedCode` para los bloques
   ` ```tasks `. Detalle completo en el `CLAUDE.md` de ese repo.
2. **Lógica de toggle y queries (extensión-a-extensión, vía API exportada, no
   webview-a-webview):** el webview avisa a su propio extension host por `postMessage`, y ese
   extension host llama a la API pública que **esta** extensión expone desde `activate()` — ver
   `src/api/TasksApi.ts`:

   ```ts
   // vscode.extensions.getExtension('angelCastro.obsidian-like-tasks')?.exports
   interface TasksExtensionApi {
     isTaskLine(lineText: string): boolean;
     toggleTaskLine(lineText: string): string[];               // 1 línea, o 2 si crea una recurrencia
     renderTasksQuery(queryText: string): TasksQueryResultDTO;  // ejecuta una query ```tasks``` contra todo el vault
     toggleTaskAtLocation(path: string, line: number): Promise<void>; // alterna una tarea en CUALQUIER fichero del vault
     editTaskAtLocation(path: string, line: number): Promise<void>;   // abre el diálogo "Create or edit Task" para esa tarea
     onDidChangeTasks: vscode.Event<void>;                      // para que Obsidian-like refresque los bloques visibles
   }
   ```

   Obsidian-like trata esto como dependencia **opcional** (comprueba que `getExtension(...)` existe
   antes de llamar, con fallback a un toggle simple `[ ]`↔`[x]` si esta extensión no está
   instalada) para seguir funcionando de forma standalone. `renderTasksQuery`/`toggleTaskAtLocation`/
   `editTaskAtLocation` devuelven datos vacíos/no-op si no hay workspace folder abierto (nada que
   indexar), no un error.

   **`editTaskAtLocation` existe específicamente por esto**: el comando
   `tasksManager.createOrEditTask` de esta extensión (basado en el cursor de
   `vscode.window.activeTextEditor`) no tiene forma de saber en qué línea estaba el usuario cuando
   la pestaña activa muestra el fichero a través del editor personalizado de **otra** extensión —
   VS Code no expone la posición del cursor de un `CustomTextEditorProvider` ajeno. Antes, ese caso
   caía silenciosamente a "crear una tarea nueva al final del documento" (ahora al menos avisa con
   un mensaje, ver `createOrEditTaskAtCursor` en `commands/taskCommands.ts`), pero seguía sin poder
   editar la tarea real que el usuario tenía delante. Obsidian-like, en cambio, sí sabe exactamente
   qué tarea pulsó el usuario en su propio webview (igual que ya sabe lo suficiente para llamar a
   `toggleTaskAtLocation`) — así que su UI de "editar tarea" llama a `editTaskAtLocation(path,
   line)` en vez de (o antes de) invocar el comando de la paleta.

   **Cableado del lado de `c:\git\obsidianlike` (implementado)**: cada checkbox de tarea —
   tanto en línea (`TaskCheckboxWidget`) como en filas de resultados de un bloque ` ```tasks ` —
   muestra un botón ✏️ junto al checkbox (`.cm-task-edit-btn` / `.cm-task-query-edit-btn`) que
   envía `{ type: 'edit-task', line }` o `{ type: 'edit-task-at-location', path, line }` al
   extension host de Obsidian-like, el cual llama a `editTaskAtLocation`. Detalle completo en la
   sección "Editing a task" del `CLAUDE.md` de ese repo.

### Scripts npm

```bash
npm run compile   # tsc -p ./   → genera out/
npm run watch     # tsc en modo watch
npm run package   # compile + vsce package --allow-missing-repository → genera .vsix
```

### Setup en máquina nueva

```bash
git clone <repo>
cd obsidianlike_tasks

# Si hay problemas de SSL corporativo:
npm install --strict-ssl=false

npm run compile
```

Para depurar: abrir la raíz del repo en VS Code y pulsar **F5** (lanza Extension Development Host).

### Gotchas conocidos

- **SSL corporativo**: `npm install` puede fallar con `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Usar `--strict-ssl=false`.
- **`@types/vscode` incompleto**: si solo aparece `package.json` sin `index.d.ts` en `node_modules/@types/vscode/`, el paquete se descargó a medias por el SSL. Borrar `node_modules/` y reinstalar con `--strict-ssl=false`.
- **`tsconfig.json` usa `module: commonjs`**: cambiar a `Node16` rompe los imports relativos con `.js` que la API de VS Code no espera en extensiones.
- **`tsconfig.json` necesita `"include": ["src/**/*"]` explícito**: desde que los fuentes viven en
  la raíz del repo, `obsidian-tasks-code/` es hermano de `src/` (antes estaba fuera del árbol de
  `vscode-extension/` y ni se veía). Sin `include`, el patrón por defecto `**/*` arrastra también
  los `.ts` de `obsidian-tasks-code/`, que chocan con `rootDir: "src"` (`error TS6059: File ...
  is not under 'rootDir'`). El síntoma es una pared de docenas de errores TS6059 apuntando a
  ficheros de `obsidian-tasks-code/tests|src/...` que nunca deberían compilarse.
- **`.vscodeignore` no debe excluir `node_modules/**`**: `vsce package` ya sabe incluir solo las
  `dependencies` reales (excluyendo `devDependencies` como `typescript`) — si además hay una
  línea `node_modules/**` en `.vscodeignore`, la pisa y las excluye TODAS, incluidas `moment`/
  `rrule`/`chrono-node`, que sí se usan en tiempo de ejecución. Sin esas dependencias en el
  `.vsix`, `activate()` lanza `Cannot find module 'moment'` **antes de registrar ningún
  comando** — síntoma: cualquier comando de la extensión da "command not found", sin pista
  aparente de por qué. Diagnosticado leyendo `%APPDATA%\Code\logs\<sesión>\window*\exthost\exthost.log`
  (o el del perfil correspondiente) en busca de `Activating extension ... failed`.
- **`activeTextEditor`/`editorLangId`/`editorTextFocus` no existen para editores personalizados**:
  si otra extensión (p. ej. Obsidian-like) abre `.md` con un `CustomTextEditorProvider`, VS Code no
  lo expone como `TextEditor` ni activa esos context keys. Cualquier comando o `menus.commandPalette`
  `when` que dependa de ellos queda invisible/no-op mientras esa extensión sea el editor activo.
  Alternativa: `vscode.window.tabGroups.activeTabGroup.activeTab.input` (con `TabInputText` /
  `TabInputCustom`) + `vscode.workspace.openTextDocument(uri)` para resolver el documento sin
  depender de un `TextEditor`.
- **Un objeto con `get` (getter) pierde su comportamiento "vivo" al hacer `{ ...obj }`**: el
  spread evalúa cada getter **inmediatamente, una sola vez**, y copia el valor resultante como
  propiedad fija — no preserva el getter. `activate()` construye la API pública con
  `{ ...createTasksApi(...) }`; `TasksApi.ts` definía `onDidChangeTasks` como
  `get onDidChangeTasks() { return taskIndex?.onDidChange ?? ...; }`, y como ese spread ocurre
  **antes** de que `taskIndex` se cree, el getter siempre veía `undefined` y dejaba fijado para
  siempre un `EventEmitter` huérfano que nadie disparaba — Obsidian-like se "suscribía con éxito"
  pero nunca recibía nada. Arreglado pasando un `EventEmitter` **estable**, creado a nivel de
  módulo antes de que exista `taskIndex`, como parámetro de `createTasksApi(...)`, en vez de
  calcularlo con un getter en el momento del spread. Diagnosticado con un `OutputChannel` real
  (no `console.log`, que no se ve en una extensión instalada normalmente) rastreando el punto
  exacto donde el evento se disparaba pero el suscriptor no se enteraba.

### Próximos pasos posibles

- Ampliar `core/Query/Query.ts` hacia la paridad completa del DSL original (`urgency` como
  criterio de orden por defecto, `sort by function`, toggles reales de layout para `hide`/`show`
  en vez de no-op, expansión de `{{query.file.path}}` y otros placeholders de
  `Scripting/ExpandPlaceholders.ts`)
- UI de settings real para `Config/Settings.ts` (hoy son valores por defecto fijos) y para
  registrar statuses personalizados (p. ej. "Delegated") usados en `status.name`/`status.type`
- Editor de `On Completion` en `TaskEditWebview.ts` (único campo del modal original que sigue sin
  puerto; ver la sección de `TaskEditWebview.ts` más arriba)
- Tests automatizados con `@vscode/test-electron` (hoy la validación es manual/smoke-test)
- `renderTaskLine` (listado de un bloque ` ```tasks ` en el Preview nativo de VS Code) solo
  muestra prioridad/vencimiento/recurrencia como badges — no tags, `id`, dependencias,
  fecha de inicio ni backlink con encabezado. El editor CM6 de Obsidian-like (`renderTaskRow` en
  `webview-src/editor.js` de ese repo) ya sí los muestra, consumiendo los campos `tags`/`id`/
  `dependsOn`/`startDate`/`heading` que `TaskDTO` (`src/api/TasksApi.ts`) ya expone — portar el
  mismo tratamiento aquí sería solo trabajo de plantilla/CSS, los datos ya están disponibles en
  `Task`.
