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

## Alternativa: abrirla desde tu Mac (localhost), como SynapMed

No necesita internet ni GitHub.

1. Doble clic en **`Iniciar SynapLite.command`**. Regenera `app/`, inicia el servidor en segundo plano y abre `http://localhost:8766`. Puedes cerrar la ventana que aparece.
2. En Chrome: ⋮ → **Transmitir, guardar y compartir → Instalar página como app** (o el ícono de instalar en la barra de direcciones).
3. **`Detener SynapLite.command`** apaga el servidor; los datos no se borran.

La app instalada desde `localhost:8766` solo abre si el servidor está encendido. Los datos se guardan por dirección: la copia de `localhost:8766` y la de GitHub Pages son bases separadas (pasa los datos con Exportar e Importar).

## 2. Instalarla
- **Chrome en computadora:** abre la dirección y pulsa el ícono de instalar en la barra de direcciones. También puedes ir a ⋮ → *Transmitir, guardar y compartir* → *Instalar página como app*.
- **Android (Chrome):** ⋮ → *Instalar app* o *Agregar a la pantalla principal*.
- **iPhone (Safari):** botón Compartir → *Agregar a inicio*.

Ábrela una vez con internet. Desde ese momento funciona sin señal.

## Seguridad, copias y transferencia

- **Cifrado y bloqueo** (botón *Seguridad*): cifra los pacientes en el dispositivo con AES-256 y pide contraseña al abrir; se bloquea sola tras la inactividad que elijas. Al activarlo se muestra una **clave de recuperación** que debes guardar fuera del dispositivo: sin la contraseña ni esa clave, los datos no se pueden recuperar.
- **Respaldo automático diario** (botón *Respaldo*): guarda en una carpeta a la hora elegida (21:00 por defecto) mientras la app esté abierta; si no lo estaba, al abrirla. Con el cifrado activo, las copias van cifradas y se abren con la contraseña que había al hacerlas, o con la clave de recuperación.
- **Transferir a otro dispositivo** (*Respaldo → Transferir…*): crea un archivo cifrado con un código de un solo uso; en el otro dispositivo, *Importar* → archivo → código.
- **Bitácora** (botón *Bitácora*): lista los cambios y permite deshacer los últimos 12 mientras la app siga abierta.

## Pruebas y revisión clínica

```bash
cd ~/Documents/SynapLite
node tests/run.js              # pruebas automáticas (corren el código real de la app)
node tests/genformulas.js      # regenera la tabla de rangos de docs/FORMULAS.md
```

`docs/FORMULAS.md` lista todas las fórmulas, cortes y reglas de alertas para que se revisen clínicamente antes de usar la app con pacientes reales.

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
