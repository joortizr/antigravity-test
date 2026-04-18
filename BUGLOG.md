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
