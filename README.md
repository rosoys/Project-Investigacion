# Trazo · Planificación CPM

Aplicación local en React y Node.js para resolver proyectos con duraciones deterministas. Requiere Node.js 20.19+ o 22.12+.

## Ejecutar

```sh
npm install
npm run dev
```

Abrir http://localhost:3000. Para producción local:

```sh
npm run build
npm start
```

Abrir http://localhost:3001. Verificaciones: `npm test`.

## Publicar en Render

Crear un **Web Service** conectado al repositorio de GitHub y configurar:

- Branch: `main`.
- Build Command: `npm ci && npm run build`.
- Start Command: `npm start`.
- Health Check Path: `/api/health`.
- Usar una versión compatible de Node.js (por ejemplo, 22.12+).

El servidor de producción escucha en `0.0.0.0` y utiliza el puerto de la variable `PORT` que asigna Render. Sin `PORT`, usa 3001. Se puede cambiar la dirección mediante `HOST`.

El desarrollo local sigue usando `npm run dev` en http://localhost:3000. La ejecución local con `npm start`, después de compilar, sigue disponible en http://localhost:3001.

## Uso

1. Ingresar nombre y descripción del proyecto, unidad, identificador único, nombre, responsable (nombre y apellido), duración positiva y predecesoras de cada actividad. El responsable es opcional y se incluye en el listado del informe; si no se ha definido aparece “Sin asignar”. El switch permite asignar identificadores automáticos (A…Z, AA, AB…) o editarlos manualmente. Al activar el modo automático se actualizan las referencias de las dependencias. Se puede cargar el ejemplo de 23 semanas.
2. Construir la red. Reproducir o avanzar manualmente la ida (máximos de sumas en cuadros), regreso (mínimos de restas en triángulos) y marcado progresivo de todas las conexiones críticas. La vista se desplaza automáticamente hacia el evento analizado.
3. Consultar tiempos, holguras y Gantt.
4. El informe muestra la descripción seguida del tiempo de ejecución destacado. Abrir el informe y seleccionar Imprimir / Guardar como PDF en el diálogo del navegador.

El proyecto se conserva en localStorage del navegador. No hay base de datos ni cuentas, ni controles de importación o exportación JSON. El servidor valida y calcula mediante `POST /api/solve`.

## Método

Red de actividades en flechas (AOA). La construcción inicial asigna eventos propios y une las actividades terminales al evento final común. La regla general se aplica a cualquier actividad, intermedia o terminal, con una o varias predecesoras: se fusionan los extremos de una ficticia cuando su origen tiene una única salida y la fusión no genera lazos ni pares de eventos duplicados. Se conservan las ficticias de arranque desde el evento inicial y las de bifurcación para el seguimiento didáctico solicitado. Las ficticias que representan precedencias selectivas permanecen; por ejemplo, si C espera a A y B, pero E solo a B, no se fusionan los eventos de forma que E también deba esperar a A. Flechas ficticias de duración cero unen las precedencias; se utiliza un origen y un final comunes, sin puentes ficticios de cierre. La simplificación conserva las precedencias y los cálculos CPM; los eventos se renumeran de inicio a fin. No se garantiza una red globalmente mínima para cualquier combinación de dependencias.

Ida: E(j) = máx(E(i) + d(i,j)). Regreso: L(i) = mín(L(j) − d(i,j)). Holgura total: L(j) − E(i) − d(i,j). Tolerancia numérica absoluta para criticidad: 1e-8.

El Gantt usa inicios tempranos y tiempo relativo desde cero. En el paso de actividades se configura tiempo hábil (días seleccionados) o natural (siete días), horas por jornada y hora de inicio. La hora de fin se calcula automáticamente, indicando si termina al día siguiente. Las semanas y días se interpretan según esa configuración; el informe presenta la equivalencia en horas de jornada, que no son horas-persona. La configuración inicial usa semana estándar de lunes a viernes; Personalizado permite elegir otros días o tiempo natural. Horas e inicio de jornada usan campos compactos y se rechazan letras en las horas. La fecha de inicio es opcional: al indicarla, el informe calcula la entrega estimada, con su hora de cierre. Un inicio no laborable se ajusta al siguiente día hábil. El Gantt conserva su eje relativo. No se descuentan feriados ni se contemplan restricciones de recursos. Para la fecha de entrega, los meses se interpretan como meses calendario, limitando al último día válido del mes; las fracciones se redondean a días completos y el resultado se ajusta al siguiente día laborable, al inicio de la jornada. Esta convención se indica en el informe. No hay conversión fija de meses a horas. La configuración se conserva en el navegador; los proyectos anteriores usan cinco días hábiles, ocho horas y jornada de 08:00 a 16:00 por defecto. No se incluye estimación probabilística PERT. Se admiten hasta 100 actividades; las redes grandes requieren desplazamiento horizontal y pueden resultar pequeñas en una sola página impresa. Las fuentes de Google son opcionales: hay fuentes locales de respaldo.
