# Bug Log

Este registro documenta los errores críticos y su proceso técnico de debugging durante el desarrollo.

| Campo del BUGLOG | Qué escribir |
| :--- | :--- |
| **ID del bug** | BUG-001 |
| **Archivo afectado** | `.github/workflows/ci.yml` |
| **Síntoma** | GitHub Actions arroja una advertencia o paraliza la ejecución indicando que `actions/checkout@v4`, `actions/setup-node@v4` y `actions/cache@v4` utilizan Node 20 internamente y que Node 20 ha sido *deprecated* (obsoleto). |
| **Causa raíz** | A partir de mediados del año 2024, GitHub Actions comenzó a requerir que los plugins estándar corran sobre motores V8/Node.js modernos (versión 24). Las extensiones antiguas invocadas no adoptan la nueva versión automáticamente a menos que un flag de entorno se los ordene al *runner*. |
| **Fix aplicado** | Se insertó `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` en el bloque global `env:` del archivo para migrar las sub-acciones al motor nuevo. Se reemplazaron todas las líneas `node-version: 20` por `node-version: 24` bajo el tab de configuración de entorno. |
| **Test de regresión** | Evaluación automática sintáctica del YAML en el panel "Actions" de Github post-push corroborando la desaparición del tag amarillo (warning) de Deprecation. |
| **Tipo de error agentic** | *Contexto Heredado / Obsolescencia de Terceros* (El flujo heredado usaba paquetes que se volvieron obsoletos externamente). |
| **ID del bug** | BUG-002 |
| **Archivo afectado** | `.github/workflows/ci.yml` |
| **Síntoma** | Persistencia de la advertencia: "Node.js 20 is deprecated... are being forced to run on Node.js 24". |
| **Causa raíz** | Aunque se forzó la ejecución en Node 24, el uso de versiones obsoletas de las acciones (`v4`) que tienen `node20` en su metadatos (`action.yml`) provoca que GitHub siga emitiendo advertencias de discrepancia. |
| **Fix aplicado** | Actualización de las acciones a versiones nativas de Node 24 (`v6`) y consolidación de la lógica de caché dentro de `setup-node@v6` para eliminar dependencias externas de Node 20. |
| **Test de regresión** | Verificación en el panel de Actions de que la ejecución es limpia y carece de anotaciones de deprecación o forzado. |
| **Tipo de error agentic** | *Falta de profundidad técnica* (El primer fix fue solo una configuración de entorno sin actualizar los componentes core). |
| **ID del bug** | BUG-003 |
| **Archivo afectado** | `package.json` |
| **Síntoma** | El pipeline de CI falla en el job `lint` con el error `sh: 1: eslint: not found`. |
| **Causa raíz** | La dependencia `eslint` no estaba declarada en `devDependencies`, por lo que `npm ci` en el entorno limpio de GitHub Actions no la instalaba, a pesar de existir un script que la invocaba. |
| **Fix aplicado** | Instalación formal de `eslint` y plugins de React/Typescript necesarios en las `devDependencies`. |
| **Test de regresión** | Ejecución exitosa del comando `npm run lint` en el servidor de CI. |
| **Tipo de error agentic** | *Falta de restricciones* (Se asumió que el entorno tenía las herramientas necesarias sin verificar el manifiesto de dependencias). |
