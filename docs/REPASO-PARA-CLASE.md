# Trazo · Repaso para la presentación

Esta hoja sirve para ensayar. La explicación completa, las fórmulas y el recorrido del código están en [la guía del programa](GUIA-DEL-PROGRAMA.md).

## Tu explicación en 30 segundos

“Trazo es una aplicación web para planificar proyectos mediante CPM. El usuario define actividades, duraciones, responsables y dependencias. El programa construye una red con actividades en flechas, calcula tiempos tempranos y tardíos, obtiene las holguras y marca las rutas críticas. Además, presenta un Gantt y un informe con entrega estimada. React administra la interfaz, Node.js ejecuta CPM y Render permite usarlo desde internet”.

## Cinco ideas que debes poder explicar sin mirar

1. No se suman todos los tiempos porque existen actividades paralelas.
2. En la ida se **suma y se elige el máximo**: hay que esperar a todas las entradas.
3. En el regreso se **resta y se elige el mínimo**: hay que respetar todas las salidas.
4. Una actividad crítica tiene **holgura total cero**; puede haber varias rutas críticas.
5. Una ficticia vale **cero en tiempo**, pero puede representar una dependencia indispensable.

## Fórmulas imprescindibles

```text
Cuadro:     E(j) = máx [E(i) + d(i,j)]
Triángulo:  L(i) = mín [L(j) - d(i,j)]
IT  = E(i)               FT  = E(i) + d(i,j)
ITa = L(j) - d(i,j)      FTa = L(j)
Holgura total = ITa - IT = L(j) - E(i) - d(i,j)
```

El cuadro y el triángulo guardan tiempos de eventos. El fin temprano de una actividad no tiene que coincidir con el cuadro de su destino: otra entrada puede obligar a ese evento a esperar más.

## Ejemplo que debes recordar

| Actividad | Predecesoras | Duración | IT | FT | ITa | FTa | Holgura |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | — | 3 | 0 | 3 | 0 | 3 | 0 |
| B | A | 3 | 3 | 6 | 9 | 12 | 6 |
| C | A | 7 | 3 | 10 | 3 | 10 | 0 |
| D | C | 2 | 10 | 12 | 10 | 12 | 0 |
| E | B, D | 4 | 12 | 16 | 12 | 16 | 0 |
| F | D | 3 | 12 | 15 | 13 | 16 | 1 |
| G | E, F | 7 | 16 | 23 | 16 | 23 | 0 |

**Ruta crítica:** A → C → D → E → G. **Duración:** 23 semanas. Sumar todas las actividades da 29, pero hay paralelismo.

E comienza en máx(6,12) = 12. G comienza en máx(16,15) = 16. B puede empezar hasta 9, frente a su inicio temprano en 3; tiene 6 semanas de holgura.

Si F pasa de 3 a 4, consume su holgura y aparecen dos ramas críticas sin aumentar las 23 semanas. Si pasa a 5, el proyecto tarda 24.

## Tecnología: no confundas sus funciones

| Elemento | Responsabilidad |
| --- | --- |
| React | Interfaz, estado, formularios, animación y componentes. |
| Node.js | Servidor HTTP y ejecución de `solve`. |
| Vite | Desarrollo y compilación de React. |
| SVG | Dibujo vectorial de la red. |
| localStorage | Guarda el proyecto en ese navegador, sin base de datos. |
| GitHub | Guarda el código y el historial. |
| Render | Ejecuta y publica la aplicación. |

**Flujo:** formulario → POST `/api/solve` → motor CPM → resultados y pasos → React los dibuja. El cálculo completo ocurre antes de reproducir; la animación es una explicación visual.

**Dónde está cada cosa:** `src/cpm.js` calcula; `src/main.jsx` muestra; `src/calendar.js` estima fechas; `server/index.js` recibe solicitudes; `tests/` verifica resultados.

## Calendario y alcance

Semana estándar: lunes a viernes, 8 horas, de 8:00 AM a 4:00 PM. Veintitrés semanas equivalen a 115 días hábiles y 920 horas de jornada, no horas-persona. El inicio 26/10/2026 da entrega 02/04/2027 a las 4:00 PM sin descontar feriados.

La app implementa **CPM determinista**, no PERT probabilístico. No nivela recursos, no descuenta feriados y no calcula esfuerzo por responsable. El Gantt usa tiempo relativo. La fecha estimada del proyecto se calcula aparte.

Las ficticias se simplifican con una regla general de precedencias y unicidad de arcos. Se conservan las de arranque por criterio didáctico. La red no se presenta como globalmente mínima.

## Demostración en seis pasos

1. Carga el ejemplo y explica E y G como uniones de dependencias.
2. Muestra responsables y calendario.
3. Construye la red y explica una suma con máximo.
4. Muestra el regreso y una resta con mínimo.
5. Señala B = 6, F = 1 y la ruta crítica de 23 semanas.
6. Abre el informe: descripción, duración, entrega, listado, Gantt, tabla y red final.

## Preguntas para practicar en voz alta

- ¿Por qué la ruta crítica es la más larga y no la más corta?
- ¿Qué pasaría si seleccionaras el mínimo en la ida?
- ¿Cuándo no puedes eliminar una ficticia?
- ¿Qué diferencia hay entre evento y actividad?
- ¿Por qué B termina en 6 y su evento de llegada puede ocurrir en 12?
- ¿El responsable cambia el cálculo? ¿Dónde se guardan los datos?
- ¿En qué se diferencia GitHub de Render?
- ¿Qué falta para implementar PERT probabilístico?

## Antes de entrar a clase

- Comprueba el sitio y prepara también la ejecución local.
- Ten abierto el ejemplo y una copia PDF del informe.
- Revisa `npm test`: la versión documentada tiene 30 pruebas, una de ellas contrasta 40 redes.
- Explica las limitaciones y el apoyo recibido durante el desarrollo con transparencia.
- Evita memorizar frases sin comprenderlas: intenta justificar cada número del ejemplo.
