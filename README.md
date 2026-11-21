# Flipbook PDF — Maki Makio

Proyecto listo para convertir un PDF en un flipbook web con efecto realista de pasar página.

## Qué incluye

- `index.html` — estructura del visor.
- `styles.css` — diseño responsive y estética del flipbook.
- `script.js` — carga el PDF, renderiza sus páginas y activa el page flip.
- `assets/manual.pdf` — el Manual de Marca Maki Makio incluido como ejemplo.

## Uso rápido

1. Abre la carpeta en VS Code.
2. Instala/usa la extensión **Live Server**.
3. Clic derecho sobre `index.html` → **Open with Live Server**.
4. El flipbook cargará automáticamente `assets/manual.pdf`.

También puedes pulsar **Cambiar PDF** o arrastrar cualquier PDF directamente sobre el visor.

## Poner otro PDF sin modificar JavaScript

Reemplaza:

`assets/manual.pdf`

por tu nuevo PDF y conserva exactamente el nombre `manual.pdf`.

## Por qué conviene usar Live Server

Los navegadores suelen bloquear la lectura de archivos PDF locales cuando `index.html` se abre con doble clic (`file://`). Con Live Server se sirve el proyecto por `http://localhost` y el PDF se carga normalmente.

## Dependencias

El proyecto usa por CDN:

- PDF.js 3.11.174
- StPageFlip 2.0.7

Por eso necesita conexión a internet para cargar esas dos librerías. El PDF puede seguir siendo completamente local.

## Controles

- Arrastrar una esquina de la página.
- Clic sobre la página.
- Flechas ← y → del teclado.
- Botones laterales.
- Inicio / Final.
- Pantalla completa.
- Drag & drop de otro PDF.

## Portada y páginas dobles

`showCover: true` hace que la primera página funcione como portada individual. Al abrirla, el manual se muestra en doble página, como un libro real. En pantallas pequeñas cambia automáticamente a una sola página.
