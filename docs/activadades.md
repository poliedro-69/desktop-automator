Interacción con teclado
Actividad	Descripción	Parámetros
Tecla individual	Pulsa Enter, Escape, F5, etc.	key: "enter", repeat: 3

Ventanas y escritorio
Actividad	Descripción	Parámetros
Cambiar ventana (Alt+Tab)	Cambia entre ventanas abiertas aleatoriamente	times: 3
Minimizar/Restaurar	Minimiza la ventana activa y la restaura tras N segundos	delay: 5
Scroll en ventana activa	Hace scroll up/down en la ventana que esté en foco	direction: "down", amount: 5
Cerrar ventana activa	Envía Alt+F4 a la ventana en primer plano	—
Mover ventana	Arrastra la ventana activa a otra posición	x: 200, y: 100

Archivos y carpetas
Actividad	Descripción	Parámetros
Crear archivo temporal	Crea un .txt con contenido aleatorio en una carpeta	folder: "C:\\Temp", content: "notas..."
Renombrar archivo	Renombra un archivo existente	path: "...", newName: "..."
Abrir carpeta en Explorer	Abre una carpeta en el explorador de archivos	path: "C:\\Users\\..."

Red y comunicación
Actividad	Descripción	Parámetros
Ping a host	Hace ping a una IP/hostname y reporta respuesta	host: "8.8.8.8", count: 4
Request HTTP	Hace un GET/POST a una URL y lee la respuesta	url: "...", method: "GET"
Abrir Outlook/Mail	Lanza el cliente de correo	—
Abrir Teams/Slack	Lanza la app de mensajería corporativa	app: "teams"

Automatización visual
Actividad	Descripción	Parámetros
Doble click	Doble click en coordenadas específicas	x, y
Drag and drop	Arrastra desde (x1,y1) hasta (x2,y2)	fromX, fromY, toX, toY
Click + esperar elemento	Click y pausa configurable (simula "esperar carga")	x, y, waitMs: 2000
Seleccionar texto con mouse	Arrastra para seleccionar un área de texto	fromX, fromY, toX, toY

Productividad simulada
Actividad	Descripción	Parámetros
Alternar entre N URLs	Abre varias pestañas y va rotando entre ellas	urls: ["url1", "url2", ...], interval: 30
Escribir en Notepad	Abre Notepad y escribe texto progresivamente	text: "...", wpm: 60
Guardar documento (Ctrl+S)	Envía Ctrl+S a la ventana activa	—
Imprimir (Ctrl+P)	Abre diálogo de impresión	—

Sistema
Actividad	Descripción	Parámetros
Cambiar volumen	Sube/baja volumen del sistema	action: "up"/"down"/"mute"
Bloquear pantalla	Bloquea Windows (Win+L) — útil como acción final	—
Vaciar papelera	Vacía la papelera de reciclaje	—
Cambiar fondo de pantalla	Cambia el wallpaper a una imagen	path: "..."
Ejecutar .bat/.cmd	Ejecuta un script batch	path: "C:\\scripts\\report.bat"

Tiempo y scheduling
Actividad	Descripción	Parámetros
Esperar hasta hora	Pausa la ejecución hasta un horario específico	until: "14:30"
Pausa aleatoria	Espera entre N y M segundos (más natural que la pausa fija)	min: 10, max: 60
Activar solo en horario	Solo ejecuta si la hora actual está en un rango	from: "09:00", to: "18:00"
