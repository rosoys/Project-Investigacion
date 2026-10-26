# Trazo · Guía del programa y preparación para la defensa

**Proyecto:** aplicación web didáctica de planificación mediante CPM.  
**Versión documentada:** código del proyecto revisado el 25 de octubre de 2026.  
**Aplicación:** https://project-investigacion.onrender.com  
**Repositorio:** https://github.com/rosoys/Project-Investigacion

Esta guía explica lo que la aplicación hace actualmente. Diferencia el procedimiento matemático, la visualización y las funciones que todavía no se han implementado. Está pensada para estudiar antes de presentar y para consultar el código durante una defensa técnica.

## Cómo estudiar esta guía

Primero lee las secciones 1 a 7: debes comprender el problema y poder resolver el ejemplo sin depender de la pantalla. Después estudia las secciones 8 a 13 para explicar cómo se programó. Ensaya la demostración de la sección 16 y responde las preguntas de la sección 17 con tus propias palabras. Usa el archivo `REPASO-PARA-CLASE.md` para repasar al final.

## 1. Qué problema resuelve

Un proyecto contiene actividades con duraciones y dependencias. Algunas pueden ejecutarse en paralelo; otras deben esperar a que terminen una o varias predecesoras. Sumar todas las duraciones no indica necesariamente cuánto tarda el proyecto.

Trazo permite ingresar ese conjunto de actividades y obtener la duración mínima compatible con las precedencias y duraciones dadas, sin restricciones de recursos. También identifica las actividades cuyo retraso afectaría la fecha final y muestra el procedimiento de cálculo.

**Una forma de presentarlo:** “Trazo transforma un listado de actividades en una red, calcula los tiempos tempranos y tardíos mediante CPM, identifica las actividades críticas y presenta un cronograma y un informe gerencial”.

Tiene dos propósitos complementarios:

- **Didáctico:** mostrar sumas, restas, máximos y mínimos paso a paso.
- **Gerencial:** presentar duración, responsables, cronograma, entrega estimada y sustento del análisis.

La herramienta calcula una programación a partir de los datos ingresados. No verifica que las duraciones estimadas sean realistas ni garantiza que el proyecto se ejecute exactamente como se planificó.

## 2. CPM y PERT: qué implementamos realmente

**CPM** significa método de la ruta crítica. Esta aplicación utiliza una duración determinista por actividad: por ejemplo, “C tarda 7 semanas”. Determinista significa que el modelo toma ese número como dato fijo; no que el futuro sea completamente seguro.

**PERT** utiliza habitualmente estimaciones optimista, más probable y pesimista para modelar la incertidumbre. La versión actual no solicita esas tres estimaciones, no calcula varianzas ni probabilidades de cumplimiento.

Aunque el material de clase se titule “CPM-PERT”, la implementación actual corresponde a **CPM**. Conviene decirlo expresamente en la exposición.

## 3. Conceptos que debes dominar

| Concepto | Qué significa en el programa |
| --- | --- |
| Actividad | Trabajo que tiene identificador, nombre, duración, predecesoras y responsable opcional. |
| Evento o nodo | Momento lógico en el que se han cumplido determinadas condiciones de terminación y pueden comenzar otras actividades. No es una tarea. |
| Predecesora | Actividad que debe terminar antes de comenzar otra. |
| Sucesora | Actividad que depende de otra actividad. |
| Relación fin a inicio | La sucesora puede comenzar cuando hayan terminado sus predecesoras. Es la relación implementada. |
| Paralelismo | Actividades que pueden avanzar simultáneamente si sus dependencias están satisfechas. |
| Tiempo temprano | Primer momento en que un evento puede ocurrir. |
| Tiempo tardío | Último momento en que un evento puede ocurrir sin retrasar el proyecto. |
| Holgura total | Margen de retraso de una actividad compatible con la fecha final, manteniendo las demás condiciones del modelo. |
| Ruta crítica | Camino de inicio a fin cuya duración determina la terminación más temprana del proyecto. Sus actividades tienen holgura total cero. |
| Actividad ficticia | Flecha de duración cero que expresa una precedencia; no representa trabajo real. |
| Orden topológico | Orden donde cada predecesora aparece antes que sus sucesoras. |
| Ciclo | Dependencia circular que impide construir una programación válida. |

La ruta crítica es el camino de mayor duración de la red de precedencias. No se elige por cantidad de actividades ni por cuál línea se ve más larga en la pantalla.

Puede haber varias rutas críticas si distintos caminos tienen la misma duración máxima. La aplicación marca todas las conexiones de holgura cero; no genera una lista textual enumerada de todos los caminos posibles.

## 4. Qué ingresa el usuario

En **Actividades** se configuran el nombre y la descripción del proyecto, unidad común de tiempo, calendario, jornada y fecha opcional de inicio.

Para cada actividad se solicita:

| Campo | Ejemplo | Observación |
| --- | --- | --- |
| Identificador | A | Debe ser único y no estar vacío. |
| Nombre | Diseño de interfaces | Describe el trabajo. |
| Responsable | Ana López | Es una etiqueta de asignación, no una cuenta de usuario. Es opcional. |
| Duración | 3 | Debe ser numérica, finita y mayor que cero. |
| Predecesoras | A, C | Pueden ser varias o ninguna. |

Una actividad sin predecesoras puede comenzar desde el inicio del proyecto. Seleccionar A y C significa esperar a ambas, no elegir una de ellas.

El modo automático asigna A, B, C… Z, AA, AB… El modo manual permite escribir los identificadores. Al activar el modo automático, el programa actualiza las referencias de las dependencias al renombrar las actividades. Si se modifica un identificador manualmente después de asignar dependencias, hay que revisar y volver a seleccionar las referencias que hayan quedado desactualizadas.

La versión actual admite hasta **100 actividades**. Todas comparten la misma unidad: no se mezclan horas y semanas dentro de una sola tabla.

## 5. Cómo se construye y simplifica la red

### 5.1. Actividades en flechas

Se usa la representación **AOA**, por sus siglas en inglés: actividad en flecha. Cada actividad real se dibuja en un arco dirigido con su identificador y duración. Los círculos son eventos.

Esto sigue las reglas del material de clase: una actividad se representa una sola vez y debe poder distinguirse mediante su par de eventos de origen y destino.

El motor construye inicialmente eventos de inicio y terminación para las actividades y conexiones ficticias para sus dependencias. Las actividades terminales llegan a un evento final común. Después aplica simplificaciones seguras y renumera los eventos en orden topológico.

Los identificadores internos comienzan en 0. En la pantalla se suma 1 para mostrar eventos 1, 2, 3… Por eso “evento 1” e identificador interno 0 representan el mismo evento inicial.

### 5.2. Para qué sirven las ficticias

Ejemplo del PDF: C necesita que terminen A y B, pero E necesita solamente B. Si se juntaran sin cuidado los finales de A y B, E también quedaría esperando A. Eso agregaría una dependencia inexistente.

Una ficticia permite expresar esa diferencia. Su duración es cero, pero la precedencia que representa sí importa.

**Regla aplicada por el código:** se puede contraer una ficticia cuando es la única salida de su evento de origen y la unión no crea un lazo ni un par de eventos duplicado. La regla se aplica a cualquier nombre de actividad y a cualquier posición en el proyecto.

Se conservan las ficticias desde el evento inicial para el seguimiento didáctico solicitado. También pueden quedar ficticias en bifurcaciones y para precedencias selectivas. El algoritmo no promete construir la red con el menor número de nodos posible.

No toda ficticia que permanece es matemáticamente imprescindible en cualquier representación alternativa. Algunas se conservan por la construcción didáctica y por el criterio conservador de simplificación. Lo que se verifica es que la red conserve las precedencias y los tiempos correctos.

### 5.3. Qué es un orden topológico y por qué hace falta

Si C depende de A, A debe procesarse antes que C. El programa busca una actividad cuyas predecesoras ya estén ordenadas, la incorpora al resultado y repite.

Si quedan actividades pendientes y ninguna puede incorporarse, hay un ciclo. Por ejemplo:

```text
A depende de B
B depende de A
```

No existe una actividad que pueda empezar primero; el programa rechaza el ejercicio.

La implementación hace búsquedas y recorridos repetidos sobre arreglos. Aunque los recorridos matemáticos de una red ya ordenada son sencillos, no debe afirmarse que toda esta implementación es O(V + E): no utiliza una optimización lineal completa para la construcción y simplificación.

## 6. Cálculos CPM y significado de las casitas

Usaremos estas variables:

```text
E(i)    = tiempo más temprano del evento i
L(i)    = tiempo más tardío del evento i
d(i,j)  = duración de la actividad entre i y j
```

### 6.1. Ida: sumar y escoger el máximo

El evento inicial tiene tiempo temprano cero. Para cada evento j:

```text
E(j) = máximo de [E(i) + d(i,j)] para todas sus entradas
```

Se toma el máximo porque el evento debe esperar a todas las actividades que llegan a él. Si una termina en 6 y otra en 12, el evento puede ocurrir en 12.

En la interfaz el resultado se escribe en un **cuadro**. La fase de ida se identifica en verde.

### 6.2. Regreso: restar y escoger el mínimo

Primero se conoce la duración total T, que es el tiempo temprano del evento final. Se fija:

```text
L(final) = E(final) = T
L(i) = mínimo de [L(j) - d(i,j)] para todas sus salidas
```

Se toma el mínimo porque se debe respetar la más restrictiva de las actividades siguientes. Elegir un valor mayor podría retrasar una de las sucesoras.

El resultado se escribe en un **triángulo sobre el cuadro**, formando una casita. La fase de regreso se identifica en azul.

No hay que sumar en el regreso ni elegir automáticamente la mayor resta. El método usa sumas y máximo hacia adelante, restas y mínimo hacia atrás.

### 6.3. Tiempos y holgura por actividad

Para una actividad de i a j:

```text
IT  = E(i)                 inicio temprano
FT  = E(i) + d(i,j)        fin temprano
FTa = L(j)                 fin tardío
ITa = L(j) - d(i,j)        inicio tardío
H   = ITa - IT = FTa - FT  holgura total
H   = L(j) - E(i) - d(i,j)
```

Si H es cero, la actividad es crítica. Se resalta en rojo. Como JavaScript trabaja con números de punto flotante, el código considera cero un valor cuyo valor absoluto sea menor que `1e-8`. La presentación redondea a un máximo de cuatro decimales; los cálculos usan los valores numéricos sin ese redondeo de presentación.

Las tres condiciones del PDF para una actividad crítica son coherentes con este criterio: tiempos temprano y tardío iguales en ambos extremos, y una duración que ocupa exactamente el intervalo entre ellos. No basta con mirar que un par de nodos tenga cuadros y triángulos iguales: la actividad debe satisfacer también la condición de duración.

### 6.4. Diferencia importante: fin temprano de actividad y tiempo del evento

Si una actividad B termina en 6 y otra D termina en 12, ambas pueden llegar a un mismo evento que ocurre en 12. El fin temprano de B sigue siendo 6; el evento de reunión ocurre en 12 porque también espera a D.

Por eso no se debe leer automáticamente el cuadro del destino como el fin temprano de cada flecha que llega. El fin temprano de una actividad es el cuadro de su origen más su propia duración.

Esta diferencia aparece en el ejemplo real del programa y explica por qué la tabla y la red pueden mostrar números distintos sin contradecirse.

## 7. Ejemplo completo para defender el cálculo

### 7.1. Datos

El botón **Cargar ejemplo** prepara el sistema de comunicación para aviones:

| Actividad | Nombre | Predecesoras | Duración en semanas |
| --- | --- | --- | --- |
| A | Definición del sistema | Ninguna | 3 |
| B | Diseño de interfaces | A | 3 |
| C | Desarrollo del sistema | A | 7 |
| D | Integración de componentes | C | 2 |
| E | Validación funcional | B, D | 4 |
| F | Documentación técnica | D | 3 |
| G | Implementación final | E, F | 7 |

### 7.2. Ida expresada por actividades

```text
A: IT = 0;           FT = 0 + 3 = 3
B: IT = 3;           FT = 3 + 3 = 6
C: IT = 3;           FT = 3 + 7 = 10
D: IT = 10;          FT = 10 + 2 = 12
E: IT = máx(6,12);   FT = 12 + 4 = 16
F: IT = 12;          FT = 12 + 3 = 15
G: IT = máx(16,15);  FT = 16 + 7 = 23
```

E espera a B y D. G espera a E y F. La duración mínima del proyecto es **23 semanas**.

### 7.3. Regreso expresado por actividades

```text
G: FTa = 23;          ITa = 23 - 7 = 16
E: FTa = 16;          ITa = 16 - 4 = 12
F: FTa = 16;          ITa = 16 - 3 = 13
D: FTa = mín(12,13);  ITa = 12 - 2 = 10
B: FTa = 12;          ITa = 12 - 3 = 9
C: FTa = 10;          ITa = 10 - 7 = 3
A: FTa = mín(9,3);    ITa = 3 - 3 = 0
```

### 7.4. Tabla final

| Actividad | Duración | IT | FT | ITa | FTa | Holgura total | Clasificación |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | 3 | 0 | 3 | 0 | 3 | 0 | Crítica |
| B | 3 | 3 | 6 | 9 | 12 | 6 | No crítica |
| C | 7 | 3 | 10 | 3 | 10 | 0 | Crítica |
| D | 2 | 10 | 12 | 10 | 12 | 0 | Crítica |
| E | 4 | 12 | 16 | 12 | 16 | 0 | Crítica |
| F | 3 | 12 | 15 | 13 | 16 | 1 | No crítica |
| G | 7 | 16 | 23 | 16 | 23 | 0 | Crítica |

La ruta crítica de actividades reales es **A → C → D → E → G**:

```text
3 + 7 + 2 + 4 + 7 = 23 semanas
```

La suma de todas las actividades es 29 semanas, pero hay trabajos paralelos; por eso el proyecto tarda 23 y no 29. Otros caminos de actividades reales suman 17 semanas para A–B–E–G y 22 para A–C–D–F–G.

B puede comenzar hasta la semana 9 en lugar de la 3 sin retrasar la terminación, si las demás condiciones se mantienen. F tiene una semana de margen. La holgura no significa que sea recomendable retrasar esas actividades ni que varios márgenes puedan consumirse libremente a la vez sin revisar el cronograma.

### 7.5. Casitas de la red actual del ejemplo

La numeración corresponde al código documentado; no debe usarse como regla fija para otros proyectos.

| Evento visible | Cuadro: temprano | Triángulo: tardío |
| --- | --- | --- |
| 1 | 0 | 0 |
| 2 | 0 | 0 |
| 3 | 3 | 3 |
| 4 | 3 | 9 |
| 5 | 3 | 3 |
| 6 | 10 | 10 |
| 7 | 12 | 12 |
| 8 | 12 | 12 |
| 9 | 12 | 13 |
| 10 | 16 | 16 |
| 11 | 23 | 23 |

En esta red B va del evento 4 al 8. Su FT es 3 + 3 = 6, aunque el cuadro del evento 8 sea 12. E sale de ese evento y debe esperar también a D. F termina tempranamente en 15, mientras el evento 10 ocurre en 16 porque espera también a E.

## 8. Calendario y entrega estimada

La configuración estándar es de lunes a viernes, 8 horas por jornada, comenzando a las 8:00 AM. La jornada estándar termina a las 4:00 PM. El modo Personalizado permite cambiar días y elegir tiempo natural de lunes a domingo.

Las horas se validan como números mayores que cero y hasta 24, con precisión de minutos completos. Hora, minutos y AM/PM se eligen en listas. Internamente la hora se guarda en formato de 24 horas, por ejemplo `08:00` y `16:00`; se presenta en formato AM/PM.

Para proyectar la entrega se convierte la duración CPM a tiempo de jornada:

```text
1 semana = cantidad de días seleccionados × horas por jornada
1 día    = horas por jornada
1 hora   = 60 minutos
```

Ejemplo: 23 semanas de 5 días y 8 horas equivalen a **115 días hábiles y 920 horas de jornada**. Esas horas son duración sobre el calendario del proyecto; no son esfuerzo de personal ni 920 horas de cada responsable.

Si se indica como inicio el lunes **26 de octubre de 2026**, con esa configuración la entrega estimada es el viernes **2 de abril de 2027 a las 4:00 PM**, sin descontar feriados.

Si el inicio cae en un día no laborable, se mueve al siguiente día permitido y el informe lo indica. Una duración que termina exactamente al cierre de la jornada conserva ese día como fecha final. Las fracciones de tiempo se redondean hacia arriba al minuto para proyectar la entrega.

Las jornadas nocturnas pueden terminar al día siguiente; por ejemplo, de 10:00 PM a 6:00 AM. Se consideran jornadas continuas: no se modelan almuerzo ni descansos separados.

**Meses:** no tienen un número fijo de días hábiles. La aplicación usa una convención de meses calendario para la entrega: conserva el día del mes si existe, limita al último día disponible si no existe, redondea las fracciones a días completos y ajusta al siguiente día permitido al inicio de la jornada. Esta convención se informa en el reporte. Para una demostración académica más fácil de verificar, conviene trabajar en semanas, días u horas.

El cálculo usa fechas UTC como referencia aritmética para evitar cambios por la zona horaria del navegador. No representa un sistema de horarios internacionales: se muestra la jornada tal como la define el proyecto, sin convertirla entre países.

La fecha de entrega es una estimación bajo los supuestos del modelo, no una promesa contractual ni un resultado probabilístico.

## 9. Qué muestra cada pantalla

| Pantalla | Función |
| --- | --- |
| Actividades | Ingreso del proyecto, responsables, duraciones, precedencias, calendario y fecha de inicio. |
| Red y análisis | Red AOA, cuadros, triángulos, operaciones, controles de reproducción, conexiones críticas y tabla de tiempos. |
| Diagrama de Gantt | Programación de inicio temprano con barras proporcionales a la duración. |
| Informe gerencial | Descripción, duración, entrega estimada, responsables, listado, Gantt, tabla y red crítica final. |

Las barras rojas del Gantt indican actividades críticas. Las otras barras muestran actividades no críticas y una línea discontinua representa el margen de holgura. El eje usa tiempo relativo desde cero, no fechas de calendario para cada actividad.

La posición horizontal de una barra se calcula como `IT / duración total × 100%`; su ancho es `duración de la actividad / duración total × 100%`.

El informe coloca el Gantt inmediatamente debajo del listado. Después presenta tiempos y holguras y termina con la red crítica como sustento del análisis. La impresión usa `window.print()` y estilos CSS de impresión; guardar PDF depende del diálogo del navegador, no de una biblioteca de generación de PDF en el servidor.

## 10. Arquitectura: React, Node.js y Vite

```text
USUARIO EN EL NAVEGADOR
  React: formularios, validación de calendario y fecha, estado, SVG y Gantt
       |
       | POST /api/solve  →  actividades en JSON
       v
SERVIDOR NODE.JS
  handler HTTP → solve(activities) → valida y resuelve CPM
       |
       | respuesta JSON: nodes, edges, results, duration, steps
       v
NAVEGADOR
  dibuja los resultados y reproduce los pasos ya calculados
  estima la entrega con el calendario del proyecto
  guarda el proyecto en localStorage
```

**React** organiza la interfaz en componentes y actualiza lo mostrado cuando cambia el estado. El proyecto usa JavaScript y JSX; JSX permite describir elementos de interfaz dentro de funciones de JavaScript. No se usa TypeScript. [Documentación de React](https://react.dev/learn).

**Node.js** ejecuta JavaScript en el servidor. Usamos su módulo integrado `node:http`; no utilizamos Express. El servidor atiende las solicitudes y llama al motor CPM. [API HTTP de Node.js](https://nodejs.org/api/http.html).

**Vite** sirve la interfaz durante el desarrollo y genera la versión compilada de producción. En producción no se ejecuta el servidor de desarrollo: Node entrega los archivos de `dist/`. [Compilación con Vite](https://vite.dev/guide/build.html).

**CSS** define presentación, adaptación a pantalla pequeña, colores, transiciones y estilo de impresión. **SVG** dibuja los elementos vectoriales de la red. El Gantt utiliza elementos HTML y CSS propios. No se usan bibliotecas externas de diagramas o Gantt. [SVG en MDN](https://developer.mozilla.org/en-US/docs/Web/SVG).

Los cálculos de calendario y fecha de entrega se ejecutan en el navegador. El cálculo CPM y su validación se ejecutan en el servidor. Compartir JavaScript entre ambos no significa que todo corra en el mismo lugar.

## 11. Mapa de archivos y funciones

| Archivo | Qué contiene | Qué puedes explicar al mostrarlo |
| --- | --- | --- |
| `src/main.jsx` | Componentes `App`, `Network`, `Results` y `Gantt`. | Formularios, estado, envío a API, visualización, impresión y controles. |
| `src/cpm.js` | `solve`, `simplifyNetwork`, `fmt` y datos de ejemplo. | Validación del problema, red, recorridos, holguras y pasos. |
| `src/calendar.js` | Validaciones, jornada, conversión AM/PM y `estimateDelivery`. | Cómo se interpreta la unidad y se proyecta la entrega. |
| `src/activities.js` | Identificadores automáticos y actualización de referencias. | Cómo continúa el alfabeto después de Z y se evitan IDs ocupados. |
| `src/style.css` | Estilos de pantalla e impresión. | Diseño, fases, legibilidad y reporte. |
| `server/index.js` | Servidor de producción, archivos estáticos y API. | Cómo se entrega React y se atiende el cálculo. |
| `server/dev.js` | Vite en modo middleware y API durante desarrollo. | Cómo conviven React y el servidor en localhost:3000. |
| `tests/*.test.js` | Pruebas de motor, calendario e identificadores. | Evidencia automatizada de los resultados esperados. |
| `index.html` | Contenedor HTML inicial y referencia a la entrada React. | Punto desde el que se monta la interfaz. |
| `package.json` | Dependencias y comandos. | React, React DOM, Vite y scripts de ejecución. |
| `package-lock.json` | Versiones resueltas de las dependencias. | Instalaciones reproducibles con `npm ci`. |
| `.gitignore` | Excluye `node_modules/`, `dist/` y `.DS_Store`. | Por qué esas carpetas no están en GitHub. |

### 11.1. Estado y efectos en React

En `App`, `project` guarda los datos ingresados; `data` guarda la respuesta del cálculo; `tab` indica la pantalla activa; `index` indica el paso visible; `playing` indica si la reproducción está en marcha y `speed` define la pausa.

`useState` mantiene esos valores. `useEffect` guarda el proyecto, administra el temporizador y lleva la página al inicio al cambiar de pestaña. En `Network`, `useRef` permite acceder al contenedor desplazable para centrar el evento que se analiza.

Cuando se modifica el proyecto se descartan los resultados anteriores para exigir un nuevo cálculo y evitar presentar una red desactualizada. Los responsables no cambian la matemática, pero su edición también invalida el resultado porque el flujo actual trata cualquier edición del proyecto de la misma forma.

### 11.2. Cómo funciona la animación

El servidor calcula toda la solución antes de que comience la reproducción. Cada paso contiene una fase, evento, título, fórmula y conexiones relevantes.

El navegador aumenta el índice con un temporizador y dibuja solo los cuadros, triángulos y conexiones que corresponden a los pasos alcanzados. La reproducción no recalcula CPM a cada segundo ni solicita una operación distinta al servidor por cada evento.

Se puede pausar, retroceder, avanzar, reiniciar y elegir pausas de 1.5, 2.5, 4 o 6 segundos. Cambiar de pestaña pausa la reproducción.

El desplazamiento automático transforma las coordenadas del evento en SVG a coordenadas del contenedor, considerando la escala del dibujo. Después centra el evento con desplazamiento suave.

### 11.3. Distribución gráfica

El campo `rank` representa el nivel de cada evento según sus entradas. Los niveles se distribuyen de izquierda a derecha y los eventos del mismo nivel se separan verticalmente.

Es un diseño por niveles, no un optimizador avanzado de cruces. Con muchas actividades la red puede ser extensa y necesitar desplazamiento. La longitud física de una flecha no representa la duración de la actividad: esa duración está en su etiqueta.

## 12. API y almacenamiento

### 12.1. Solicitud de cálculo

La interfaz usa `fetch` para enviar una solicitud HTTP `POST` a `/api/solve` con un cuerpo JSON:

```json
{
  "activities": [
    {
      "id": "A",
      "name": "Preparación",
      "responsible": "Ana López",
      "duration": 3,
      "predecessors": []
    }
  ]
}
```

La respuesta exitosa tiene estado HTTP 200 e incluye `nodes`, `edges`, `results`, `duration` y `steps`. Si el motor detecta datos inválidos, la API devuelve HTTP 400 con un mensaje en `error`.

`GET /api/health` responde con `{"status":"ok"}`. Sirve para comprobar que el proceso responde; no sustituye las pruebas de cálculo ni verifica que todos los archivos de interfaz estén correctos.

JSON continúa siendo el formato interno de comunicación aunque se hayan eliminado de la interfaz los botones de importar y guardar JSON.

### 12.2. Dónde se guardan los proyectos

El proyecto se serializa en `localStorage`, bajo la clave `trazo-project`, en el navegador de cada usuario. No hay base de datos, inicio de sesión ni sincronización entre dispositivos. [Almacenamiento local en MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

Se conserva un proyecto por ese espacio de almacenamiento; no existe una biblioteca de proyectos. Localhost y la dirección de Render son orígenes diferentes y no comparten el mismo almacenamiento. Borrar los datos del sitio o cambiar de navegador puede hacer que el proyecto no aparezca. La navegación privada también limita la persistencia.

El resultado calculado y la posición de la animación no se guardan: tras recargar, puede ser necesario volver a construir la red.

Las actividades, incluidos los responsables, se transmiten al servidor al calcular. El código no las escribe en una base de datos. Eso no equivale a afirmar que no hay tráfico ni registros técnicos del proveedor de alojamiento. Para una exposición conviene usar nombres y proyectos ficticios.

## 13. Ejecución local, GitHub y Render

Son tres cosas diferentes:

- **GitHub:** conserva y comparte el código y su historial.
- **Tu computadora:** permite desarrollar y ejecutar la aplicación localmente.
- **Render:** ejecuta el servidor y permite acceder desde una dirección pública.

Para instalar y desarrollar:

```bash
git clone https://github.com/rosoys/Project-Investigacion.git
cd Project-Investigacion
npm ci
npm run dev
```

Se abre `http://localhost:3000`. Se necesita una versión de Node compatible con Vite: por ejemplo, Node 22.12 o superior dentro de una versión soportada.

Para producción local:

```bash
npm run build
npm start
```

Se abre `http://localhost:3001` si no se ha definido otro puerto.

| Comando o variable | Función |
| --- | --- |
| `npm ci` | Instala las versiones del archivo de bloqueo, sin actualizarlo. |
| `npm install` | Instala dependencias y puede resolver o actualizar el archivo de bloqueo según el proyecto. |
| `npm run dev` | Ejecuta `server/dev.js` con Vite y API local. |
| `npm run build` | Ejecuta Vite y genera `dist/`. |
| `npm start` | Ejecuta `server/index.js` y entrega la versión compilada. |
| `npm test` | Ejecuta las pruebas con `node --test`. |
| `PORT` | Puerto asignado por el alojamiento; sin él, producción usa 3001. |
| `HOST` | Dirección de escucha configurable; producción usa 0.0.0.0 por defecto. |

`0.0.0.0` indica que el servidor escucha en las interfaces disponibles. No es el enlace que escribe el visitante. Render recibe las solicitudes públicas y las dirige al puerto del proceso. [Servicios web de Render](https://render.com/docs/web-services).

En Render se configura la rama `main`, construcción `npm ci && npm run build`, inicio `npm start` y verificación `/api/health`. El símbolo `&&` indica ejecutar el segundo comando solamente si el primero termina correctamente.

No se debe afirmar que cada actualización de GitHub ya está publicada: el despliegue puede tardar o fallar. La actualización automática depende de la configuración del servicio y del resultado del despliegue.

## 14. Validaciones y evidencia de funcionamiento

El motor comprueba que haya actividades, que no se supere el límite de 100, que los identificadores sean únicos, que identificador y nombre estén completos, que las duraciones sean válidas, que existan las predecesoras y que no haya autorreferencias ni ciclos.

El calendario comprueba días, jornada y formato horario. La fecha se verifica para rechazar días inexistentes, como 30 de febrero. Los controles de horas impiden letras y se valida también el valor numérico.

La versión documentada tiene **30 pruebas automatizadas** en tres archivos:

| Grupo | Casos relevantes |
| --- | --- |
| Identificadores | Continuación AA/AB, IDs libres y conservación de referencias al activar automático. |
| Calendario | Semanas hábiles y naturales, jornadas fraccionarias, fines de semana, meses, horarios nocturnos y conversión AM/PM. |
| CPM | Ejemplo de 23 semanas, múltiples rutas críticas, decimales, ciclos, datos inválidos, ficticias y responsables. |

Una prueba contrasta **40 redes generadas de forma determinista** con cálculos independientes por actividades. Compara duración, tiempos, holguras y relaciones de precedencia alcanzables. Es una sola prueba que contiene 40 casos; no deben sumarse como 40 pruebas separadas al total de 30.

También se verificó el servidor real en los puertos 3001 y 10000: entrega de HTML, JavaScript y CSS, estado de salud y cálculo CPM. La compilación y las pruebas del motor no sustituyen una revisión visual exhaustiva de todos los navegadores o tamaños de pantalla.

**Cómo mostrar evidencia en clase:** ejecutar `npm test`, explicar qué resultado se espera y enseñar un caso inválido que la aplicación rechaza. Que un programa dibuje una red bonita no prueba por sí solo que sus resultados sean correctos.

## 15. Alcance actual y limitaciones que puedes defender con honestidad

| Alcance actual | Limitación o trabajo futuro |
| --- | --- |
| CPM con una duración por actividad. | No hay estimación probabilística PERT. |
| Dependencias fin a inicio. | No hay adelantos, retrasos configurables ni relaciones inicio a inicio o fin a fin. |
| Responsable como nombre y apellido. | No hay disponibilidad de personal, cuentas ni nivelación de recursos. La misma persona puede aparecer en actividades paralelas. |
| Calendario común del proyecto. | No hay calendarios distintos por actividad, feriados ni pausas dentro de la jornada. |
| Fecha estimada del proyecto. | No hay seguimiento de avance real ni fechas de calendario en cada barra del Gantt. |
| Red didáctica simplificada. | No se garantiza el mínimo global de nodos ni la eliminación de todos los cruces. |
| Hasta 100 actividades. | Las redes grandes pueden resultar poco legibles y pequeñas en una página impresa. |
| Guardado en el navegador. | No hay respaldo central, sincronización ni varios proyectos administrados. |
| Informe mediante impresión del navegador. | El resultado del PDF puede variar según escala, papel y navegador. |
| Aplicación pública sin cuentas. | No es un sistema empresarial con permisos, auditoría, pruebas de carga ni protección completa contra abuso. |

Las 30 pruebas no permiten afirmar que no existen errores. La validación central de CPM sí ocurre en el servidor, pero la del calendario y la entrega se hace en la interfaz. Es una aplicación educativa funcional, no una certificación de planificación para proyectos de alto riesgo.

No hay una API de inteligencia artificial integrada: los resultados los produce el algoritmo determinista del código. Si te preguntan por el proceso de desarrollo, explica el apoyo recibido con transparencia y de acuerdo con las normas de tu curso; lo defendible es comprender y poder verificar cada decisión y resultado.

## 16. Guion de presentación de 8 a 10 minutos

### Minuto 0 a 1: problema y objetivo

“En un proyecto no basta sumar las duraciones, porque hay actividades paralelas y dependencias. Trazo aplica CPM para calcular la duración del proyecto, identificar actividades críticas y explicar el procedimiento gráficamente”.

### Minuto 1 a 2: entrada de datos

Abre Actividades y carga el ejemplo. Muestra que cada actividad tiene identificador, nombre, responsable, duración y predecesoras. Señala que E espera a B y D y que G espera a E y F.

Selecciona semana estándar, 8 horas y 8:00 AM. Si quieres mostrar la fecha verificable de esta guía, indica 26/10/2026. Aclara que no se descuentan feriados.

### Minuto 2 a 4: recorrido de ida

Construye la red y usa avance manual o reproducción. Explica que las actividades están en las flechas y los círculos son eventos. En una unión, muestra por qué se toma el máximo. Señala que los cuadros guardan tiempos tempranos.

“E no puede iniciar en 6 solo porque B ya terminó. Debe esperar también a D, que termina en 12”.

### Minuto 4 a 5: recorrido de regreso

Pausa en una operación representativa. Explica que se parte del tiempo final, se resta la duración y se elige el mínimo. Señala los triángulos y las casitas.

### Minuto 5 a 6: holguras y ruta crítica

Muestra la tabla: B tiene holgura 6 y F tiene 1. Explica la ruta A–C–D–E–G y suma sus duraciones para obtener 23. Deja que la animación marque las conexiones críticas.

### Minuto 6 a 7: Gantt e informe

Muestra el Gantt de inicio temprano, las barras críticas y las actividades paralelas. Abre el informe y señala descripción, duración, entrega estimada, responsables y sustento final de la red.

### Minuto 7 a 8: parte técnica

“React administra la interfaz y la animación. Node recibe los datos y ejecuta el motor CPM. Vite prepara los archivos de producción. GitHub conserva el código y Render lo ejecuta públicamente. El proyecto se guarda en el navegador, sin base de datos”.

### Minuto 8 a 10: pruebas y límites

Muestra que existen pruebas y comenta el caso de 23 semanas. Menciona ciclos y precedencias selectivas. Cierra indicando que la versión actual implementa CPM determinista y que PERT probabilístico y nivelación de recursos serían ampliaciones.

Para no depender de internet, prepara antes una ejecución local, una captura del ejemplo y un PDF del informe. Abre el sitio con anticipación para comprobar que responde. No modifiques el código en vivo si no es necesario para la exposición.

## 17. Preguntas del profesor y respuestas que debes comprender

### ¿Por qué no sumar todas las duraciones?

Porque varias actividades pueden ejecutarse simultáneamente. La terminación depende del camino de mayor duración compatible con las precedencias. En el ejemplo la suma es 29, pero la duración del proyecto es 23.

### ¿Por qué máximo en la ida y mínimo en el regreso?

En la ida deben terminar todas las entradas: manda la que llega más tarde. En el regreso deben respetarse todas las salidas: manda el límite más temprano de ellas.

### ¿Por qué la ruta crítica es la más larga si se busca terminar pronto?

Porque ese camino impone el límite inferior de la duración total. El proyecto no puede terminar antes de completar todas sus actividades, incluidas las del camino más largo.

### ¿Toda actividad de holgura cero es crítica?

Sí, bajo los supuestos de este CPM y la tolerancia numérica usada. La red puede contener varias rutas críticas. No se confunde holgura total con holgura libre: la versión actual calcula y presenta holgura total.

### ¿Puede cambiar la ruta crítica?

Sí. Si cambian duraciones o dependencias, otro camino puede pasar a ser el más largo. Por eso una edición invalida el resultado anterior y exige recalcular.

### ¿Qué pasa si E aumenta de 4 a 5 semanas?

En el ejemplo se mantiene crítica y el proyecto pasa de 23 a 24 semanas. Debe recalcularse para confirmarlo; no se altera solo el número del informe.

### ¿Qué pasa si F aumenta de 3 a 4 semanas?

Consume su semana de holgura. El proyecto sigue en 23 y aparecen dos ramas críticas después de D: por E y por F. Si F aumenta a 5, el proyecto pasa a 24 por la rama de F.

### ¿Para qué sirve una flecha que dura cero?

Para expresar una dependencia lógica sin introducir trabajo ni tiempo. También se conservan algunas conexiones de arranque por claridad didáctica. Quitar una ficticia sin revisar la red puede cambiar quién debe esperar a quién.

### ¿Dos actividades pueden terminar en el mismo nodo?

Sí, si sus dependencias permiten compartir ese evento. Se debe evitar agregar precedencias y mantener identificables las actividades por sus pares de eventos. El programa comprueba esas condiciones al simplificar.

### ¿Por qué no se eliminan todas las ficticias?

Algunas separan relaciones de precedencia distintas. Otras se conservan por el criterio didáctico y conservador de construcción. El objetivo actual es una red correcta y explicable, no demostrar que sea globalmente mínima.

### ¿Los números de los nodos son los nombres de las actividades?

No. Los nodos representan eventos y se renumeran al construir la red; A, B o el ID personalizado identifican trabajos. La ruta A–C–D–E–G se refiere a actividades reales, no a números de eventos.

### ¿Por qué el evento al que llega B indica 12 si B termina en 6?

Porque ese evento también espera otra entrada que termina en 12. El FT de B se calcula con el temprano de su origen más la duración de B, no copiando el cuadro del destino.

### ¿El programa está calculando mientras se reproduce?

La solución completa ya fue calculada por el servidor. La reproducción revela ordenadamente los pasos y operaciones para estudiar el método.

### ¿Cómo se dibuja la red?

Con SVG generado por React. El motor devuelve eventos y flechas; el componente los distribuye por niveles y dibuja círculos, líneas, cuadros, triángulos y etiquetas.

### ¿Por qué React y Node si ambos usan JavaScript?

React resuelve la interfaz interactiva en el navegador. Node proporciona el proceso de servidor que atiende solicitudes y ejecuta CPM. Se comparte lenguaje, pero son responsabilidades y entornos diferentes.

### ¿Se usó Express o una biblioteca que resuelve CPM?

No. El servidor usa `node:http` y el motor CPM está implementado en `src/cpm.js`. La red y el Gantt también se dibujan con componentes propios.

### ¿Dónde está la base de datos?

No hay base de datos. Se usa localStorage para el proyecto en el navegador. El servidor recibe las actividades, calcula y devuelve resultados, sin guardarlos en una base de datos.

### ¿El responsable afecta la ruta crítica?

No. Solo documenta la asignación. El sistema no considera cargas de trabajo o disponibilidad, por lo que asignar la misma persona a dos actividades paralelas no impide que el modelo las programe simultáneamente.

### ¿La fecha estimada considera fines de semana y feriados?

Respeta los días configurados de la semana y la jornada. No descuenta feriados ni ausencias. La fecha depende de la duración CPM y de ese calendario.

### ¿Por qué el Gantt no muestra fechas aunque el reporte sí tenga una entrega?

El Gantt actual usa tiempos relativos de inicio y fin. La entrega se calcula por separado desde la fecha de inicio del proyecto. Fechar individualmente todas las barras sería una ampliación.

### ¿Esto implementa PERT?

No implementa la parte probabilística. Usa CPM con una sola duración por actividad. PERT requeriría entradas y cálculos adicionales de incertidumbre.

### ¿Se puede usar sin internet?

La versión local puede ejecutarse después de instalar las dependencias, aunque las fuentes externas usen su alternativa local si no cargan. La versión de Render necesita conexión porque llama al servidor para calcular. El sitio no es una aplicación PWA con funcionamiento offline completo.

### ¿Cómo sabes que calcula bien?

Se contrasta el ejemplo con resultados manuales y se ejecutan pruebas de rutas críticas múltiples, dependencias, errores y calendarios. Además, se comparan tiempos y precedencias en 40 redes con un cálculo independiente por actividades. Esto da evidencia, no una garantía absoluta de ausencia de errores.

## 18. Recorrido recomendado del código durante la defensa

Si el profesor pide mostrar la implementación, sigue este orden:

1. `package.json`: identifica React, React DOM, Vite y los scripts.
2. `src/cpm.js`, función `solve`: muestra validación y orden topológico.
3. En el mismo archivo: localiza `Math.max` para la ida y `Math.min` para el regreso.
4. Muestra `slack` y la comparación con cero para explicar la criticidad.
5. `src/main.jsx`, función `calculate`: enseña la llamada a `/api/solve`.
6. `server/index.js`: enseña la ruta que llama a `solve` y responde JSON.
7. `src/main.jsx`, componente `Network`: explica que dibuja y reproduce resultados, no que inventa la ruta según la imagen.
8. `src/calendar.js`, función `estimateDelivery`: explica la entrega estimada.
9. `tests/cpm.test.js`: muestra las comprobaciones del ejemplo.

El código actual está concentrado y algunas líneas de JSX son largas. No intentes leerlas completas durante la exposición: busca los nombres de las funciones y explica su responsabilidad.

## 19. Glosario técnico breve

| Término | Explicación |
| --- | --- |
| Frontend | Parte de la aplicación que se ejecuta en el navegador y presenta la interfaz. |
| Backend | Parte del servidor que atiende solicitudes y ejecuta lógica. |
| API | Forma definida de comunicarse con el servidor; aquí usa HTTP y JSON. |
| Endpoint | Dirección concreta de la API, como `/api/solve`. |
| JSON | Formato de texto para intercambiar datos estructurados. |
| Componente | Función React que representa una parte de la interfaz. |
| Estado | Datos que React conserva para decidir qué mostrar. |
| Hook | Función como `useState`, `useEffect` o `useRef` que permite usar capacidades de React. |
| SVG | Formato vectorial usado para dibujar la red. |
| Build | Preparación de archivos optimizados para producción. |
| Deploy | Publicación y arranque de una versión en un alojamiento. |
| Commit | Registro de cambios en el historial de Git. |
| Rama | Línea de trabajo del repositorio; se publica desde `main`. |
| localStorage | Almacenamiento del navegador asociado al origen del sitio. |
| Grafo dirigido acíclico | Red con flechas donde no existen dependencias circulares. |

## 20. Referencias y criterio de verificación

La descripción del funcionamiento se basa principalmente en los archivos y pruebas del propio repositorio. Los números del ejemplo y la entrega indicada se contrastaron ejecutando `solve` y `estimateDelivery`; no se dedujeron únicamente de capturas de pantalla.

El fundamento de construcción de red y recorridos sigue el PDF de clase **CPM - Pert.pdf**, en particular las reglas de representación y precedencias de las páginas 4 a 8, los recorridos de las páginas 14 y 15 y el criterio crítico de la página 16. El PDF es material de referencia del curso y no se redistribuye dentro de esta documentación.

Referencias técnicas oficiales para ampliar:

- [React: inicio y componentes](https://react.dev/learn).
- [Node.js: servidor HTTP](https://nodejs.org/api/http.html).
- [Vite: compilación de producción](https://vite.dev/guide/build.html).
- [MDN: almacenamiento local](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
- [MDN: SVG](https://developer.mozilla.org/en-US/docs/Web/SVG).
- [Render: servicios web y puertos](https://render.com/docs/web-services).

Estas páginas pueden describir versiones posteriores de las herramientas. Para reproducir las dependencias del proyecto se utiliza `package-lock.json`, no el número más reciente mostrado en una página web.
