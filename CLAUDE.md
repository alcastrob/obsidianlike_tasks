# vscode-tasks

## Qué es este repositorio

Monorepo con dos proyectos:

- **`obsidian-tasks-code/`** — código fuente del plugin [Obsidian Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) (subido como referencia/inspiración).
- **`vscode-extension/`** — extensión de VS Code para gestión de tareas, estilo Obsidian Tasks. **Este es el proyecto activo.**

---

## vscode-extension

### Objetivo

Extensión de VS Code llamada **"Obsidian-Like Tasks"** que permite crear, completar y eliminar tareas directamente desde el editor, sin salir al navegador ni a otra app. Inspirada en el plugin Tasks de Obsidian. El nombre evita confundirla con la funcionalidad nativa de VS Code "Tasks" (`tasks.json`, `Tasks: Run Build Task`, etc.) — por eso todos los comandos de esta extensión llevan el prefijo `Obsidian-Like Tasks:` en la Command Palette.

**Identificador interno**: `package.json`'s `name` es `obsidian-like-tasks` (la carpeta del repo sigue llamándose `vscode-extension/`, sin relación), así que el id de extensión es `angelCastro.obsidian-like-tasks`. Vault Tool (`d:\git\obsidianlike\src\extension.ts`, función `getTasksApi()`) depende de este id exacto como dependencia opcional (`vscode.extensions.getExtension('angelCastro.obsidian-like-tasks')`) — si vuelve a cambiar `name`, hay que actualizarlo también ahí y en `d:\git\obsidianlike\CLAUDE.md`.

### Stack

- TypeScript (`^5.4.0`), compilado a CommonJS ES2020
- VS Code Extension API (`^1.85.0`)
- `moment` / `rrule` / `chrono-node` — motor de fechas y recurrencia (dependencias reales en
  tiempo de ejecución; ver el gotcha de `.vscodeignore` más abajo)
- `@vscode/vsce` (`^3.0.0`) — para empaquetar en `.vsix`

### Estructura de archivos

```
vscode-extension/
├── package.json              ← manifest (comandos, configuración)
├── README.md                 ← documentación de cara al usuario (qué hace, comandos, instalación)
├── tsconfig.json             ← CommonJS, ES2020, outDir=out, esModuleInterop
├── .vscodeignore
├── src/
│   ├── extension.ts              ← activate()/deactivate(); activate() es async (espera al
│   │                                escaneo inicial) y devuelve la TasksExtensionApi completa
│   │                                (ver "Fase 2" más abajo)
│   ├── TaskIndex.ts              ← escanea/vigila *.md del workspace, cachea Task[] parseadas
│   ├── TaskCodeLensProvider.ts   ← CodeLens "Done/Edit" sobre cada línea de tarea
│   ├── TaskDecorations.ts        ← tachado de completadas + resaltado de vencidas
│   ├── markdownTasksPlugin.ts    ← markdown-it: renderiza bloques ```tasks``` en el Preview
│   ├── commands/taskCommands.ts  ← toggle / crear-editar tarea vía QuickInput
│   ├── api/TasksApi.ts           ← API pública exportada (consumida por Vault Tool)
│   └── core/                     ← port fiel del motor de Obsidian Tasks (ver abajo)
└── out/                      ← JS compilado (generado, no commitear)
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
`priority is [above|below] <nivel>`, `path includes/does not include`, `description
includes/does not include`, **`description regex matches /patrón/flags`**, `tags include/do not
include`, `no tags`, `heading includes`, `is [not] recurring`, y **`filter by function
<expresión JS>`** (evalúa código arbitrario con `task` en scope — ver el aviso de seguridad en
`ScriptingTaskView.ts`: es contenido del propio vault del usuario, no entrada externa, pero es
ejecución de código real).

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
| **Crear/editar tarea markdown** (descripción, prioridad, fechas, recurrencia) | comando `tasksManager.createOrEditTask`, flujo de `QuickInput` |
| **CodeLens "Done / Edit / 🔁 regla"** sobre cada línea de tarea | `TaskCodeLensProvider` |
| **Tachado de completadas + fecha vencida en rojo** en el editor | `TaskDecorations` |
| **Bloques ` ```tasks ` renderizados en el Preview de Markdown** integrado de VS Code | `markdownTasksPlugin.ts` + `contributes.markdown.markdownItPlugins` |
| Índice de tareas de todo el workspace, actualizado al vuelo | `TaskIndex` (escaneo inicial + `FileSystemWatcher` + debounce de ediciones) |

### Comandos registrados

| ID | Descripción |
|---|---|
| `tasksManager.toggleTaskLine` | Alterna el estado de la tarea markdown activa: cursor en el editor nativo, o si el archivo está abierto con un editor personalizado (Vault Tool), avisa de que no hay línea conocida |
| `tasksManager.createOrEditTask` | Crea o edita una tarea vía QuickInput. Con editor nativo, edita la línea del cursor; sin él (editor personalizado), añade una tarea nueva al final del documento |
| `tasksManager.toggleTaskAtLine` / `editTaskAtLine` | Variantes con `(uri, line)` explícitos, usadas por el CodeLens |

Ambos comandos (`toggleTaskLine`, `createOrEditTask`) resuelven el documento activo también
cuando está abierto con un editor personalizado como Vault Tool (`resolveActiveMarkdownTarget()`
en `commands/taskCommands.ts`, vía `vscode.window.tabGroups` en vez de `activeTextEditor`, que
no existe para editores personalizados) — ver "Fase 2" más abajo para el porqué.

**Importante**: ninguno de los dos comandos tiene restricción `when` en `menus.commandPalette`
(se quitó explícitamente) — un `"when": "editorLangId == markdown"` ahí los ocultaría de la
Command Palette entera cuando el editor activo es uno personalizado, por el mismo motivo que
`activeTextEditor` no existe en ese caso.

### Fase 2 — integración con Vault Tool (implementada)

Vault Tool (`d:\git\obsidianlike`) abre los `.md` con un `CustomTextEditorProvider` propio
(webview + CodeMirror 6), que **sustituye por completo** al editor de texto nativo de VS Code.
Esto significa que el `TaskCodeLensProvider` y `TaskDecorations` de esta extensión (fase 1) son
**invisibles** en cualquier nota abierta con Vault Tool — solo se ven si el usuario abre el
fichero con "Open With → Text Editor". Además, dos extensiones no pueden inyectarse código una
en el webview de la otra (aislamiento total). Por eso la integración real tiene dos piezas
separadas, no "un hook compartido", coordinadas con un agente independiente trabajando
directamente sobre `d:\git\obsidianlike` (repo Git completamente separado, sin relación de
submódulo/worktree con este):

1. **Renderizado (dentro del webview de Vault Tool, sin llamar a esta extensión):** detector de
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
     onDidChangeTasks: vscode.Event<void>;                      // para que Vault Tool refresque los bloques visibles
   }
   ```

   Vault Tool trata esto como dependencia **opcional** (comprueba que `getExtension(...)` existe
   antes de llamar, con fallback a un toggle simple `[ ]`↔`[x]` si esta extensión no está
   instalada) para seguir funcionando de forma standalone. `renderTasksQuery`/`toggleTaskAtLocation`
   devuelven datos vacíos/no-op si no hay workspace folder abierto (nada que indexar), no un error.

### Scripts npm

```bash
npm run compile   # tsc -p ./   → genera out/
npm run watch     # tsc en modo watch
npm run package   # compile + vsce package --allow-missing-repository → genera .vsix
```

### Setup en máquina nueva

```bash
git clone <repo>
cd vscode-tasks/vscode-extension

# Si hay problemas de SSL corporativo:
npm install --strict-ssl=false

npm run compile
```

Para depurar: abrir `vscode-extension/` en VS Code y pulsar **F5** (lanza Extension Development Host).

### Gotchas conocidos

- **SSL corporativo**: `npm install` puede fallar con `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Usar `--strict-ssl=false`.
- **`@types/vscode` incompleto**: si solo aparece `package.json` sin `index.d.ts` en `node_modules/@types/vscode/`, el paquete se descargó a medias por el SSL. Borrar `node_modules/` y reinstalar con `--strict-ssl=false`.
- **`tsconfig.json` usa `module: commonjs`**: cambiar a `Node16` rompe los imports relativos con `.js` que la API de VS Code no espera en extensiones.
- **`.vscodeignore` no debe excluir `node_modules/**`**: `vsce package` ya sabe incluir solo las
  `dependencies` reales (excluyendo `devDependencies` como `typescript`) — si además hay una
  línea `node_modules/**` en `.vscodeignore`, la pisa y las excluye TODAS, incluidas `moment`/
  `rrule`/`chrono-node`, que sí se usan en tiempo de ejecución. Sin esas dependencias en el
  `.vsix`, `activate()` lanza `Cannot find module 'moment'` **antes de registrar ningún
  comando** — síntoma: cualquier comando de la extensión da "command not found", sin pista
  aparente de por qué. Diagnosticado leyendo `%APPDATA%\Code\logs\<sesión>\window*\exthost\exthost.log`
  (o el del perfil correspondiente) en busca de `Activating extension ... failed`.
- **`activeTextEditor`/`editorLangId`/`editorTextFocus` no existen para editores personalizados**:
  si otra extensión (p. ej. Vault Tool) abre `.md` con un `CustomTextEditorProvider`, VS Code no
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
  siempre un `EventEmitter` huérfano que nadie disparaba — Vault Tool se "suscribía con éxito"
  pero nunca recibía nada. Arreglado pasando un `EventEmitter` **estable**, creado a nivel de
  módulo antes de que exista `taskIndex`, como parámetro de `createTasksApi(...)`, en vez de
  calcularlo con un getter en el momento del spread. Diagnosticado con un `OutputChannel` real
  (no `console.log`, que no se ve en una extensión instalada normalmente) rastreando el punto
  exacto donde el evento se disparaba pero el suscriptor no se enteraba.

### Próximos pasos posibles

- Ampliar `core/Query/Query.ts` hacia la paridad completa del DSL original (filtros de
  `dependsOn`/`id`, `urgency` como criterio de orden por defecto, `sort by function`)
- UI de settings real para `Config/Settings.ts` (hoy son valores por defecto fijos) y para
  registrar statuses personalizados (p. ej. "Delegated") usados en `status.name`/`status.type`
- Tests automatizados con `@vscode/test-electron` (hoy la validación es manual/smoke-test)
