# SynapLite como app instalable

La carpeta `app/` contiene la app lista para subir a internet. Una vez instalada, funciona sin conexión.

| Archivo | Para qué sirve |
|---|---|
| `synaplite.html` | Fuente única de la app. Los cambios se hacen aquí. |
| `build_app.py` | Genera `app/` a partir de `synaplite.html`. |
| `app/` | Lo que se sube: página, manifiesto, modo sin conexión e íconos. |

## 1. Subirla a GitHub (una sola vez)

Se publica igual que la app de finanzas. Cada `git push` a `main` ejecuta `build_app.py` en GitHub Actions y publica la carpeta `app/` en GitHub Pages.

1. Crea un repositorio **público** y **vacío** llamado `SynapLite` en https://github.com/new. No marques README, .gitignore ni licencia.
2. En la terminal:
   ```bash
   cd ~/Documents/SynapLite
   git remote add origin https://github.com/carlosefelix05-maker/SynapLite.git
   git push -u origin main
   ```
   Si pide usuario y contraseña, la contraseña es un **token personal**, no la contraseña de GitHub. Se crea en *Settings → Developer settings → Personal access tokens* con permiso `repo` y `workflow`.
3. En el repositorio, ve a **Settings → Pages → Source** y elige **GitHub Actions**.
4. En 1–2 minutos queda en `https://carlosefelix05-maker.github.io/SynapLite/`. El avance se ve en la pestaña **Actions**.

Alternativa sin git: Netlify Drop. Ejecuta `python3 build_app.py` y arrastra la carpeta `app` a https://app.netlify.com/drop (requiere una cuenta gratuita).

## 2. Instalarla
- **Chrome en computadora:** abre la dirección y pulsa el ícono de instalar en la barra de direcciones. También puedes ir a ⋮ → *Transmitir, guardar y compartir* → *Instalar página como app*.
- **Android (Chrome):** ⋮ → *Instalar app* o *Agregar a la pantalla principal*.
- **iPhone (Safari):** botón Compartir → *Agregar a inicio*.

Ábrela una vez con internet. Desde ese momento funciona sin señal.

## 3. Actualizarla después de un cambio
1. Edita `synaplite.html`, o pídeselo a Claude.
2. Guarda y sube el cambio:
   ```bash
   git commit -am "Describe el cambio"
   git push
   ```
   GitHub Actions regenera y publica la app sola.

La app instalada descarga la versión nueva sola. El cambio se ve la siguiente vez que la abras.

## Privacidad
La dirección es pública, pero la app no envía datos a ningún lado. Los pacientes y todo lo capturado se guardan solo en el dispositivo donde se capturan.
