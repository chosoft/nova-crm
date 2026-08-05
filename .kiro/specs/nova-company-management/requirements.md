# Requirements Document

## Introduction

Sistema web de gestión de empresas y universidades para el grupo estudiantil "Nova" de la Universidad Icesi. El sistema permite al comité de relaciones listar, registrar y dar seguimiento a empresas participantes en eventos bajo dos modalidades: stand y patrocinador. Adicionalmente, permite registrar y gestionar contactos con universidades para agendar eventos de difusión dentro de las mismas. El administrador controla los estados de cada entidad y puede visualizar el rendimiento de reclutamiento por miembro del comité. El diseño sigue un estilo minimalista inspirado en Apple, desplegado en Vercel con Vercel Postgres como base de datos.

## Glossary

- **Sistema**: La aplicación web de gestión de empresas de Nova
- **Admin**: El usuario administrador del sistema (gerente de relaciones) con permisos elevados para cambiar estados y ver el dashboard
- **Miembro**: Un integrante del comité de relaciones que puede registrar y listar empresas
- **Empresa**: Una marca o compañía registrada en el sistema como potencial participante en eventos
- **Modalidad**: El tipo de participación de una empresa en un evento, puede ser "stand" o "patrocinador"
- **Estado**: La etapa actual de gestión de una empresa (ej: pendiente, contactada, confirmada, rechazada)
- **Dashboard**: Panel de control del administrador que muestra métricas de rendimiento por miembro
- **Universidad**: Una institución educativa registrada en el sistema para coordinar eventos de difusión de Nova dentro de su campus
- **Evento_de_Difusión**: Una actividad de promoción de Nova agendada dentro de una Universidad

## Requirements

### Requisito 1: Registro de Empresas

**User Story:** Como Miembro del comité, quiero registrar nuevas empresas en el sistema, para poder dar seguimiento a las marcas que contactaré para eventos.

#### Criterios de Aceptación

1. WHEN un Miembro envía el formulario de registro con todos los campos obligatorios completados y válidos (nombre de la Empresa, número de contacto, descripción y Modalidad), THE Sistema SHALL crear una nueva Empresa con estado inicial "pendiente"
2. THE Sistema SHALL requerir un número de contacto de entre 7 y 15 dígitos numéricos para cada Empresa registrada
3. THE Sistema SHALL requerir una descripción de entre 1 y 500 caracteres para cada Empresa registrada
4. WHEN un Miembro registra una Empresa, THE Sistema SHALL vincular automáticamente la Empresa al Miembro que la registró
5. THE Sistema SHALL requerir que el Miembro seleccione una Modalidad ("stand" o "patrocinador") al registrar una Empresa
6. IF un Miembro envía el formulario sin completar uno o más campos obligatorios (nombre, número de contacto, descripción o Modalidad), THEN THE Sistema SHALL mostrar un mensaje de error indicando cada campo faltante sin crear la Empresa
7. THE Sistema SHALL requerir un nombre de Empresa de entre 1 y 100 caracteres, que sea único entre las Empresas registradas en el sistema
8. IF un Miembro intenta registrar una Empresa con un nombre que ya existe en el sistema, THEN THE Sistema SHALL mostrar un mensaje de error indicando que el nombre de Empresa ya se encuentra registrado sin crear un duplicado

### Requisito 2: Listado de Empresas

**User Story:** Como Miembro del comité, quiero ver la lista de empresas registradas, para poder consultar el estado y la información de cada una.

#### Criterios de Aceptación

1. WHEN un Miembro accede a la sección de empresas, THE Sistema SHALL mostrar una lista de todas las Empresas registradas ordenadas alfabéticamente por nombre, mostrando nombre, Modalidad, Estado y Miembro asignado para cada una
2. WHERE el filtro por Modalidad está activo, THE Sistema SHALL mostrar únicamente las Empresas de la Modalidad seleccionada
3. WHERE el filtro por Estado está activo, THE Sistema SHALL mostrar únicamente las Empresas con el Estado seleccionado
4. WHERE ambos filtros (Modalidad y Estado) están activos simultáneamente, THE Sistema SHALL mostrar únicamente las Empresas que cumplan ambos criterios de filtrado
5. WHEN un Miembro selecciona una Empresa de la lista, THE Sistema SHALL mostrar la vista de detalle con nombre, Modalidad, Estado, Miembro asignado, número de contacto y descripción de la Empresa
6. IF no existen Empresas registradas o los filtros aplicados no arrojan resultados, THEN THE Sistema SHALL mostrar un mensaje indicando que no hay empresas para mostrar

### Requisito 3: Gestión de Estados por el Administrador

**User Story:** Como Admin, quiero ser el único usuario capaz de cambiar el estado de una empresa, para mantener control sobre el flujo de gestión de cada marca.

#### Criterios de Aceptación

1. WHEN el Admin selecciona un nuevo Estado para una Empresa, THE Sistema SHALL actualizar el Estado de la Empresa al valor seleccionado y registrar la fecha y hora del cambio
2. IF un Miembro intenta cambiar el Estado de una Empresa, THEN THE Sistema SHALL denegar la acción y mostrar un mensaje indicando que solo el Admin puede modificar estados
3. THE Sistema SHALL permitir los siguientes valores de Estado para Empresas: "pendiente", "contactada", "confirmada", "rechazada"
4. WHEN el Admin cambia el Estado de una Empresa, THE Sistema SHALL registrar la fecha del cambio de estado en un historial visible en la vista de detalle de la Empresa
5. THE Sistema SHALL mostrar el Estado actual de cada Empresa mediante un indicador visual diferenciado por color en la lista de empresas
6. IF el Admin intenta cambiar el Estado de una Empresa al mismo Estado que ya tiene, THEN THE Sistema SHALL no realizar ningún cambio ni registrar un nuevo evento en el historial

### Requisito 4: Dashboard de Rendimiento del Administrador

**User Story:** Como Admin, quiero visualizar un dashboard con métricas de reclutamiento por miembro, para evaluar el desempeño del comité.

#### Criterios de Aceptación

1. WHEN el Admin accede al Dashboard, THE Sistema SHALL mostrar el número total de Empresas registradas por cada Miembro, identificando a cada Miembro por su nombre
2. WHEN el Admin accede al Dashboard, THE Sistema SHALL mostrar el número de Empresas en estado "confirmada" por cada Miembro
3. WHEN el Admin accede al Dashboard, THE Sistema SHALL mostrar un resumen general con el total de Empresas agrupadas por cada Estado ("pendiente", "contactada", "confirmada", "rechazada")
4. WHEN el Admin accede al Dashboard, THE Sistema SHALL mostrar por cada Miembro el número total de Universidades registradas y el número de Universidades en estado "confirmada" como dos métricas separadas
5. IF no existen Empresas ni Universidades registradas en el sistema, THEN THE Sistema SHALL mostrar un mensaje indicando que no hay datos disponibles
6. IF un Miembro no tiene Empresas ni Universidades asignadas, THEN THE Sistema SHALL mostrar el nombre del Miembro con valores de cero en todas sus métricas

### Requisito 5: Gestión de Universidades

**User Story:** Como Miembro del comité, quiero registrar universidades y agendar eventos de difusión, para coordinar la presencia de Nova en otras instituciones educativas.

#### Criterios de Aceptación

1. WHEN un Miembro envía el formulario de registro de Universidad con todos los campos obligatorios completos y válidos, THE Sistema SHALL crear una nueva Universidad con estado inicial "pendiente"
2. THE Sistema SHALL requerir los siguientes campos obligatorios para cada registro de Universidad: nombre de la Universidad (máximo 100 caracteres), nombre de contacto (máximo 80 caracteres) y número de contacto (entre 7 y 15 dígitos)
3. WHEN un Miembro registra una Universidad, THE Sistema SHALL vincular automáticamente la Universidad al Miembro que la registró
4. WHILE una Universidad tiene estado "confirmada", WHEN un Miembro o Admin agenda un Evento_de_Difusión, THE Sistema SHALL requerir una fecha futura y una descripción (máximo 300 caracteres) para crear el evento asociado a dicha Universidad
5. WHEN un Miembro accede a la sección de universidades, THE Sistema SHALL mostrar la lista de Universidades con nombre, Estado, Miembro asignado y fecha del evento agendado (o indicador de "sin evento agendado" si no existe)
6. IF un Miembro envía el formulario sin los campos obligatorios o con valores fuera de los rangos permitidos, THEN THE Sistema SHALL mostrar un mensaje de error indicando los campos faltantes o inválidos sin perder los datos ya ingresados en el formulario
7. THE Sistema SHALL permitir los siguientes valores de Estado para Universidades: "pendiente", "contactada", "confirmada", "rechazada"
8. IF un Miembro intenta cambiar el Estado de una Universidad, THEN THE Sistema SHALL denegar la acción y mostrar un mensaje indicando que solo el Admin puede modificar estados de universidades
9. IF un Miembro o Admin intenta agendar un Evento_de_Difusión para una Universidad cuyo estado no es "confirmada", THEN THE Sistema SHALL denegar la acción y mostrar un mensaje indicando que la Universidad debe estar confirmada para agendar eventos
10. WHEN el Admin selecciona un nuevo Estado para una Universidad, THE Sistema SHALL actualizar el Estado de la Universidad al valor seleccionado y registrar la fecha del cambio

### Requisito 6: Autenticación y Roles

**User Story:** Como usuario, quiero iniciar sesión en el sistema con mis credenciales, para acceder a las funcionalidades según mi rol.

#### Criterios de Aceptación

1. WHEN un usuario proporciona un correo electrónico y contraseña que coinciden con una cuenta registrada, THE Sistema SHALL autenticar al usuario y redirigirlo a la vista de Dashboard si su rol es Admin, o a la vista de listado de Empresas si su rol es Miembro
2. IF un usuario proporciona un correo electrónico o contraseña que no coinciden con una cuenta registrada, THEN THE Sistema SHALL mostrar un mensaje de error genérico indicando que las credenciales son incorrectas, sin revelar cuál campo específico es erróneo
3. IF un usuario acumula 5 intentos fallidos de inicio de sesión consecutivos para una misma cuenta, THEN THE Sistema SHALL bloquear temporalmente el inicio de sesión para esa cuenta durante 15 minutos
4. THE Sistema SHALL mantener la sesión del usuario activa hasta que el usuario cierre sesión explícitamente o transcurran 24 horas de inactividad
5. IF la sesión del usuario expira por inactividad, THEN THE Sistema SHALL redirigir al usuario a la pantalla de inicio de sesión
6. IF un usuario con rol Miembro intenta acceder a funcionalidades exclusivas del Admin (Dashboard o cambio de Estados), THEN THE Sistema SHALL denegar el acceso y redirigir al usuario a la vista de Miembro

### Requisito 7: Interfaz de Usuario Minimalista

**User Story:** Como usuario, quiero una interfaz limpia y minimalista al estilo Apple, para tener una experiencia de uso agradable y eficiente.

#### Criterios de Aceptación

1. THE Sistema SHALL utilizar una paleta de colores neutros con un máximo de 3 colores principales y 1 color de acento para acciones primarias, donde los colores neutros se definen como colores con saturación inferior al 10%
2. THE Sistema SHALL utilizar tipografía sans-serif con una jerarquía de exactamente 4 niveles de tamaño (encabezado principal, encabezado secundario, cuerpo y texto auxiliar), donde el tamaño mínimo de texto de cuerpo sea 16px en escritorio y 14px en dispositivos móviles
3. THE Sistema SHALL ser responsive, adaptando su disposición a un mínimo de 2 breakpoints: móvil (ancho de viewport menor a 768px) y escritorio (ancho de viewport igual o mayor a 768px), donde todos los elementos interactivos tengan un área de toque mínima de 44x44px en la vista móvil
4. THE Sistema SHALL utilizar un espaciado mínimo de 16px entre elementos de contenido agrupados y un espaciado mínimo de 32px entre secciones distintas, manteniendo al menos un 30% del área visible como espacio en blanco en la vista de escritorio
5. WHEN un usuario accede al Sistema desde un dispositivo móvil, THE Sistema SHALL presentar la navegación principal en un menú colapsable accesible mediante un botón visible sin necesidad de desplazamiento vertical

### Requisito 8: Despliegue e Infraestructura

**User Story:** Como Admin, quiero que el sistema esté alojado en Vercel con Vercel Postgres, para tener una solución confiable y de fácil mantenimiento.

#### Criterios de Aceptación

1. THE Sistema SHALL desplegarse en la plataforma Vercel y ser accesible mediante una URL pública con protocolo HTTPS
2. THE Sistema SHALL utilizar Vercel Postgres como base de datos principal para almacenar toda la información de Empresas, Universidades y usuarios
3. WHEN ocurre un error de conexión a la base de datos, THE Sistema SHALL mostrar un mensaje de error al usuario indicando que el servicio no está disponible temporalmente, sin exponer nombres de servidor, credenciales ni trazas de error técnicas
4. THE Sistema SHALL responder a las peticiones del usuario en menos de 3 segundos para el 95% de las solicitudes cuando el sistema tenga hasta 20 usuarios concurrentes
5. IF ocurre un error de conexión a la base de datos durante el envío de un formulario, THEN THE Sistema SHALL preservar los datos ingresados por el usuario en el formulario para que pueda reintentar sin necesidad de volver a llenar los campos
