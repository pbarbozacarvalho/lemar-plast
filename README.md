# Catálogo de ofertas

MVP estático para publicar un catálogo en GitHub Pages, leer productos desde Google Sheets y enviar pedidos armados por WhatsApp.

## Archivos

- `index.html`: estructura de la página.
- `styles.css`: estilos visuales.
- `app.js`: carga de productos, filtros, carrito y generación del mensaje de WhatsApp.

## Datos necesarios

En `app.js`, editar el objeto `CONFIG`:

```js
const CONFIG = {
  storeName: "Le-mar Plast",
  whatsappNumber: "5491154154625",
  googleSheetCsvUrl: "",
  currency: "ARS",
  locale: "es-AR",
};
```

El número de WhatsApp debe ir con código de país, sin espacios, sin `+` y sin guiones. Ejemplo para Argentina:

```text
5493511234567
```

## Google Sheets

Crear una hoja con estas columnas:

```text
id,nombre,categoria,descripcion,precio,stock,imagen,activo
```

Ejemplo:

```text
balde-10,Balde plástico 10 L,Hogar,Balde resistente,2500,12,https://example.com/balde.jpg,SI
```

Después publicar la hoja como CSV:

1. Archivo > Compartir > Publicar en la web.
2. Elegir la hoja de productos.
3. Elegir formato `Valores separados por comas (.csv)`.
4. Copiar la URL publicada.
5. Pegarla en `googleSheetCsvUrl`.

Si `googleSheetCsvUrl` queda vacío, el sitio muestra productos de ejemplo.

## Probar en la PC

Para leer productos desde Google Sheets no conviene abrir `index.html` con doble clic, porque el navegador puede bloquear la lectura del CSV al estar en modo `file://`.

En Windows, podés probarlo así:

1. Abrir PowerShell en esta carpeta.
2. Ejecutar:

```powershell
powershell -ExecutionPolicy Bypass -File .\probar-local.ps1
```

3. Abrir en el navegador:

```text
http://localhost:8080/index.html
```

GitHub Pages también funciona porque la página se abre como sitio web `https://...`, no como archivo local.

## Imágenes

Para el MVP, la columna `imagen` debe tener una URL pública directa o una URL pública de una imagen alojada en un servicio accesible desde la web.

Google Drive puede usarse, pero no es lo más cómodo para catálogos porque sus links no siempre son directos para mostrar imágenes en una etiqueta `<img>`. Si las imágenes cambian poco, conviene subirlas al repositorio dentro de una carpeta `assets/productos`. Si el vendedor va a cargarlas seguido desde el celular, conviene usar Cloudinary, Firebase Storage o Supabase Storage.

## Destacados

El carrusel muestra automáticamente los primeros 5 productos activos con stock mayor a cero.

## Stock automático

Con GitHub Pages + Google Sheets en modo CSV público, la página puede leer stock pero no puede descontarlo de forma segura por sí sola. Para descontar stock automáticamente hace falta una pieza con permisos de escritura, por ejemplo:

- Google Apps Script conectado a la planilla.
- Supabase o Firebase como base de datos.
- Un backend propio.

La alternativa recomendada para mantener bajo costo es agregar después un endpoint de Google Apps Script que reciba el pedido, lo guarde en otra hoja y descuente stock.

## Publicación en GitHub Pages

1. Crear un repositorio en GitHub.
2. Subir estos archivos.
3. Ir a Settings > Pages.
4. En `Build and deployment`, elegir `Deploy from a branch`.
5. Seleccionar rama `main` y carpeta `/root`.
6. Guardar y esperar la URL pública.
