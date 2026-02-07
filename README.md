# San Valentín 💖 — Mini juego de misión

Página web interactiva tipo mini-juego para pedirle a tu pareja que sea tu San Valentín. Incluye una **misión** de 3 retos (Reacción, Memoria, Decisión), barra de progreso, mensajes de feedback y celebración final con confeti y corazones.

## Descripción del juego

1. **Intro:** Mensaje inicial + botón "Comenzar misión".
2. **Misión:** Objetivo claro ("Completa la misión para desbloquear la pregunta final") + barra de progreso (0/3) + "Empezar".
3. **Reto 1 — Reacción:** Tocar los corazones antes de que desaparezcan (objetivo: 3 corazones). Feedback inmediato.
4. **Reto 2 — Memoria:** Se muestra brevemente una cuadrícula con un corazón. Luego hay que elegir dónde estaba. Sin castigos: si fallas, se muestra la respuesta y se continúa.
5. **Reto 3 — Decisión:** Pregunta romántica con 2–3 opciones; una es la "correcta". Si aciertas o fallas, se continúa igual.
6. **Victoria:** "Has desbloqueado la pregunta final 💖" + botón "Continuar".
7. **Pregunta final:** "¿Quieres ser mi San Valentín?" con botones "Sí 💘" y "Claro que sí 😍".
8. **Celebración:** Animación de confeti y corazones + mensaje final personalizable.

Todo el texto es editable en `index.html` y en el objeto `CONFIG` de `script.js`.

## Estructura del proyecto

```
/
├── index.html
├── styles.css
├── script.js
├── assets/
│   ├── sounds/   (opcional: audios)
│   └── images/   (opcional: imágenes)
├── README.md
└── .gitignore
```

## Cómo correr localmente

- **Opción 1:** Abrir `index.html` directamente en el navegador (doble clic o arrastrar al navegador).
- **Opción 2:** Con Python 3:  
  `python -m http.server 8000`  
  Luego abrir: `http://localhost:8000`
- **Opción 3:** Con Node.js:  
  `npx serve .`  
  Usar la URL que muestre (ej. `http://localhost:3000`).

No hace falta instalar dependencias; es HTML + CSS + JS vanilla.

## Deploy en AWS Lightsail (Ubuntu + Nginx)

El proyecto son solo archivos estáticos. Pasos para publicarlo en una instancia Ubuntu de Lightsail usando Nginx y conectándote por **Lightsail SSH en el navegador** (sin cliente SSH local).

### 1. Crear instancia en Lightsail

1. Entra en **AWS Lightsail** → **Create instance**.
2. **Plataforma:** Linux/Unix.
3. **Blueprint:** OS Only → **Ubuntu 22.04 LTS** (o la última LTS).
4. **Plan:** El más bajo es suficiente para un sitio estático.
5. Nombre de instancia (ej. `san-valentin`) → **Create instance**.

### 2. Conectarte por SSH (navegador)

1. En la instancia, pulsa el icono **Terminal** (SSH).
2. Se abre una consola en el navegador. Ya estás conectado como usuario por defecto (ej. `ubuntu`).

### 3. Instalar Nginx

En la terminal del navegador:

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 4. Subir los archivos del proyecto

**Opción A — Subir por la consola (pegar contenido):**

1. Crear el directorio del sitio:

```bash
sudo mkdir -p /var/www/san-valentin
sudo chown -R $USER:$USER /var/www/san-valentin
```

2. Desde tu PC, en la carpeta del proyecto, genera el contenido de cada archivo (por ejemplo con `cat index.html`). Luego en Lightsail:

```bash
cd /var/www/san-valentin
nano index.html
```

Pega el contenido, guarda (Ctrl+O, Enter, Ctrl+X). Repite para `styles.css` y `script.js`. Crear carpetas si quieres:

```bash
mkdir -p assets/images assets/sounds
```

**Opción B — Usar “Upload” de Lightsail (si está disponible):**

1. En la instancia, pestaña **Connect** → a veces hay opción de subir archivos.
2. Sube `index.html`, `styles.css`, `script.js` y, si usas, la carpeta `assets/`.

**Opción C — Clonar desde Git (si el repo está en GitHub/GitLab):**

```bash
sudo apt install -y git
sudo mkdir -p /var/www/san-valentin
sudo chown -R $USER:$USER /var/www/san-valentin
cd /var/www/san-valentin
git clone https://github.com/TU-USUARIO/san-valentin.git .
# Si solo quieres los archivos estáticos en la raíz:
# mv index.html styles.css script.js assets /var/www/san-valentin/  (ajusta según la estructura del repo)
```

### 5. Configurar Nginx para el sitio estático

1. Crear un sitio de Nginx:

```bash
sudo nano /etc/nginx/sites-available/san-valentin
```

2. Pegar esta configuración (ajusta `server_name` si tienes dominio):

```nginx
server {
    listen 80;
    listen [::]:80;
    root /var/www/san-valentin;
    index index.html;
    server_name _;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(css|js|ico|png|jpg|jpeg|gif|svg|woff|woff2)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

3. Activar el sitio y recargar Nginx:

```bash
sudo ln -sf /etc/nginx/sites-available/san-valentin /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Abrir el puerto 80 en Lightsail

1. En la instancia → pestaña **Networking**.
2. En **Firewall** asegúrate de que esté permitido **HTTP (80)**. Si no, añade una regla: aplicación **HTTP**, puerto 80.

### 7. Ver el sitio

En Lightsail, copia la **IP pública** de la instancia. En el navegador abre:

```
http://TU-IP-PUBLICA
```

Deberías ver la página de San Valentín. Si tienes dominio, más adelante puedes poner un **Load Balancer** o apuntar el DNS a esta IP y, si quieres, añadir HTTPS con Let's Encrypt (certbot).

## Editar textos y opciones

- **HTML:** En `index.html` puedes cambiar todos los mensajes visibles (intro, objetivo de la misión, títulos de retos, pregunta final, celebración).
- **JS:** En `script.js`, al inicio, el objeto **CONFIG** permite cambiar:
  - Número de corazones a atrapar (Reto 1), tiempo de aparición y duración.
  - Tiempo de visualización del corazón (Reto 2).
  - Opciones del Reto 3 y el índice de la opción correcta (`decision.correctIndex`, 0-based).
  - Mensajes de feedback (`messages.*`).
  - Colores y cantidad de confeti/corazones en la celebración.

## Tecnología

- HTML5, CSS3, JavaScript vanilla.
- Sin frameworks ni dependencias externas (solo Google Fonts en el HTML).
- Optimizado para móvil y desktop; uso táctil y teclado considerados.

## Licencia

Uso personal / regalo. Libre para modificar y guardar.
