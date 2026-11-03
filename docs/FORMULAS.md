# Fórmulas, cortes y reglas de SynapLite — para revisión clínica

Este documento lista **todo lo que la app calcula o clasifica por su cuenta**, con la fórmula y los cortes exactos que usa, para que un médico los revise antes de usarla con pacientes reales. La columna **✔** es para marcar lo que ya validaste; escribe tus observaciones al final. Si cambias un corte, dime cuál y lo ajusto (o edita el código indicado).

> La app es una ayuda, no un dispositivo médico: los resultados son orientativos y no sustituyen el juicio clínico.

Las pruebas automáticas (`node tests/run.js`) verifican que el código haga exactamente lo que dice este documento. No verifican que la regla clínica sea la correcta: eso es la revisión que falta.

## 1. Función renal

| Cálculo | Fórmula | Cortes de color | ✔ |
|---|---|---|---|
| TFGe CKD-EPI 2021 (sin raza) | 142 × min(Cr/κ,1)^α × max(Cr/κ,1)^−1.2 × 0.9938^edad (× 1.012 si mujer). κ = 0.9 H / 0.7 M; α = −0.302 H / −0.241 M | < 60 vigilancia; < 30 grave. Estadios G1 ≥ 90, G2 60–89, G3a 45–59, G3b 30–44, G4 15–29, G5 < 15 | |
| Depuración Cockcroft-Gault | (140 − edad) × peso ÷ (72 × Cr) (× 0.85 si mujer). Peso real, o ajustado (PBW + 0.4 × exceso) si el real pasa de 130 % del predicho | < 60 vigilancia; < 30 grave | |
| Peso predicho (ARDSNet) | H: 50 + 2.3 × (pulgadas − 60); M: 45.5 + 2.3 × (pulgadas − 60) | — | |
| BUN/Cr | BUN ÷ Cr (BUN = urea ÷ 2.14 si solo hay urea) | > 20 «sugiere prerrenal»; < 10 «intrínseco» | |

## 2. Gasometría y oxigenación

| Cálculo | Fórmula / regla | Cortes | ✔ |
|---|---|---|---|
| PaFi | PaO₂ ÷ FiO₂ (solo sangre arterial; usa la FiO₂ de la propia gasometría, si no la de VMA o la manual) | ≤ 300 vigilancia (leve); ≤ 200 grave (moderada); ≤ 100 grave | |
| SpO₂/FiO₂ | SatO₂ ÷ FiO₂ | ≤ 315 vigilancia (≈ PaFi 300); ≤ 235 grave (≈ PaFi 200) | |
| Gradiente A-a | FiO₂ × (Patm − 47) − pCO₂ ÷ 0.8 − PaO₂. Patm = 760 × e^(−altitud/8434) = **759 mmHg a 10 msnm (Los Mochis)** | Esperado = edad ÷ 4 + 4. Vigilancia si lo supera; grave si lo supera por > 20 | |
| pCO₂ esperada (Winter) | 1.5 × HCO₃ + 8 (± 2), para acidosis metabólica | Mayor → acidosis respiratoria agregada; menor → alcalosis respiratoria agregada | |
| Brecha aniónica | Na − Cl − HCO₃ (sin K). Corregida: + 2.5 × (4 − albúmina) | > 12 vigilancia; ≥ 20 grave; normal 8–12 | |
| Delta-delta | (AG − 12) ÷ (24 − HCO₃) | < 1 acidosis hiperclorémica agregada; 1–2 acidosis de brecha pura; > 2 alcalosis metabólica agregada | |

### Interpretación automática de la gasometría (reglas, en `gasInterp`)

| Regla | Detalle | ✔ |
|---|---|---|
| Rangos de pH y pCO₂ | Arterial: pH 7.35–7.45, pCO₂ 35–45. **Venosa**: pH 7.31–7.41, pCO₂ 41–51. HCO₃ normal 22–26 | |
| Trastorno primario | pH bajo + HCO₃ < 22 → acidosis metabólica; pH bajo + pCO₂ alta → acidosis respiratoria; ambos → mixta. Análogo para alcalosis. Con pH normal: por el lado del pH respecto de 7.40 (arterial) / 7.36 (venosa) | |
| Compensación metabólica | Acidosis: Winter ± 2. Alcalosis: pCO₂ esperada = 40 + 0.7 × (HCO₃ − 24) ± 5 | |
| Compensación respiratoria | Acidosis: HCO₃ esperado agudo = 24 + 0.1 × (pCO₂ − 40); crónico = 24 + 0.35 × (pCO₂ − 40). Alcalosis: agudo = 24 − 0.2 × (40 − pCO₂); crónico = 24 − 0.45 × (40 − pCO₂) | |
| Oxigenación | PaFi > 300 sin alteración; 201–300 leve; 101–200 moderada; ≤ 100 grave. Sin FiO₂: PaO₂ < 60 hipoxemia importante, < 80 leve | |
| Lactato | ≤ 2 normal; > 2 hiperlactatemia; ≥ 4 grave (hipoperfusión) | |
| Electrolitos del gasómetro | Na < 135 / > 145; K < 3.5 / > 5; Cl < 98 / > 107; Ca++ < 1.12 / > 1.32 mmol/L; Glu < 70 / > 180; Hb < 13.5 H, < 12 M (grave < 7; moderada < 10); COHb > 5 %; MetHb > 1.5 % | |

## 3. Electrolitos y metabolismo

| Cálculo | Fórmula | Cortes | ✔ |
|---|---|---|---|
| Ca corregido por albúmina | Ca + 0.8 × (4 − Alb) | Normal 8.5–10.5; grave < 7 o > 12. Si hay Ca++ medido, prevalece | |
| Na corregido por glucosa | Na + 1.6 × (Glu − 100) ÷ 100 (también muestra el factor 2.4) | < 135 / > 145 vigilancia; < 125 / > 155 grave | |
| Osmolaridad calculada | 2 × Na + Glu ÷ 18 + BUN ÷ 2.8 | Normal 275–295; grave < 260 / > 320 | |
| Déficit de agua libre | ACT × (Na ÷ 140 − 1). ACT = peso × 0.6 H / 0.5 M (0.5 / 0.45 si ≥ 65 años). Solo si Na > 145 | Na > 155 grave | |

## 4. Hígado y hemodinamia

| Cálculo | Fórmula | Cortes | ✔ |
|---|---|---|---|
| De Ritis | AST ÷ ALT | > 2 alcohol/cirrosis; < 1 hepatocelular | |
| FIB-4 | edad × AST ÷ (plaquetas × √ALT) | Bajo < 1.3 (< 2.0 si ≥ 65 años); alto > 2.67 | |
| PAM | (PAS + 2 × PAD) ÷ 3 | < 65 vigilancia; < 55 grave | |
| Índice de choque | FC ÷ PAS | ≥ 0.9 vigilancia; ≥ 1.0 grave | |

## 5. Escalas de gravedad

**SOFA** (cada componente 0–4; la app suma los que tiene y avisa cuántos de 6)

| Componente | 1 | 2 | 3 | 4 | ✔ |
|---|---|---|---|---|---|
| Respiratorio (PaFi) | < 400 | < 300 | < 200 con VMA | < 100 con VMA | |
| Coagulación (plaquetas ×10³) | < 150 | < 100 | < 50 | < 20 | |
| Hígado (BT mg/dL) | 1.2–1.9 | 2.0–5.9 | 6.0–11.9 | ≥ 12 | |
| Cardiovascular | PAM < 70 | dopamina ≤ 5 o dobutamina | dopa > 5, o norepi/epi ≤ 0.1 | dopa > 15, o norepi/epi > 0.1 (mcg/kg/min) | |
| Neurológico (Glasgow) | 13–14 | 10–12 | 6–9 | < 6 | |
| Renal (Cr mg/dL) | 1.2–1.9 | 2.0–3.4 | 3.5–4.9 (o diuresis < 500 mL/24 h) | ≥ 5 (o diuresis < 200 mL/24 h) | |

Si el vasopresor no trae dosis interpretable, se asume el nivel 3. La diuresis es la del último periodo de 24 h completo del Balance.

**qSOFA**: FR ≥ 22, PAS ≤ 100, Glasgow < 15 (1 punto cada uno; ≥ 2 alto riesgo).

**NEWS2** (escala 1 de SpO₂): FR ≤ 8 → 3, 9–11 → 1, 12–20 → 0, 21–24 → 2, ≥ 25 → 3. SpO₂ ≤ 91 → 3, 92–93 → 2, 94–95 → 1, ≥ 96 → 0. O₂ suplementario → 2. PAS ≤ 90 → 3, 91–100 → 2, 101–110 → 1, 111–219 → 0, ≥ 220 → 3. FC ≤ 40 → 3, 41–50 → 1, 51–90 → 0, 91–110 → 1, 111–130 → 2, ≥ 131 → 3. Consciencia (Glasgow < 15) → 3. Temp ≤ 35.0 → 3, 35.1–36.0 → 1, 36.1–38.0 → 0, 38.1–39.0 → 1, ≥ 39.1 → 2. Riesgo: ≥ 7 alto; 5–6 o algún parámetro en 3 → medio; resto bajo. ✔ ___

## 6. Balance hídrico

- Periodo de 24 h de **07:00 a 07:00**; turnos matutino 07–14, vespertino 14–21, nocturno 21–07. ✔ ___
- Pérdidas insensibles (opcional): 0.5 mL/kg/h × horas transcurridas. ✔ ___
- Diuresis mL/kg/h: < 0.5 vigilancia, < 0.3 grave (KDIGO). ✔ ___

## 7. Alertas

| Alerta | Regla | ✔ |
|---|---|---|
| Antibiótico | Día 3–6 «revisa cultivos y desescalar»; día 7–13 «valora duración»; ≥ 14 grave «duración prolongada». Día 1 = día de inicio | |
| Ajuste renal | Hay antibiótico activo y depuración C-G < 50 mL/min (no sugiere dosis) | |
| Dispositivos | Aviso de revisar necesidad desde: **CVC 7 d, línea arterial 7 d, catéter periférico 4 d, sonda Foley 3 d** (`DEV_TIPOS` en el código; ajústalo a tu hospital) | |
| Cr | Sube ≥ 0.3 mg/dL en 48 h (KDIGO); o ≥ 1.5 veces el mínimo de 7 días (≥ 3 veces = grave) | |
| Hb | Cae ≥ 2 g/dL entre dos sets dentro de 7 días | |
| Plaquetas | Caen ≥ 30 % (≥ 50 % grave) entre dos sets dentro de 7 días | |
| Na | Cambia ≥ 8 mEq/L en ≤ 24 h | |
| Lactato | Sube ≥ 1 mmol/L en ≤ 12 h y queda > 2 | |
| SOFA | Sube ≥ 2 puntos contra la foto del día anterior | |
| Diuresis | < 0.5 mL/kg/h en las últimas 24 h (< 0.3 grave) | |
| Gravedad sugerida (I-PASS) | **Inestable**: vasopresor, NEWS2 ≥ 7 o alguna alerta grave. **Vigilancia**: VMA, NEWS2 5–6 o cualquier alerta. Si no, estable. Se puede cambiar a mano | |

## 8. Rangos de laboratorio (semáforo)

Generados del código con `node tests/genformulas.js`. Las alertas rojas («Crítico») salen de los valores «grave».

<!-- RANGOS -->
| Parámetro | Unidad | Rangos que usa la app (normal = sin alerta; grave = rojo) | ✔ |
|---|---|---|---|
| Ure | mg/dL | normal — a 45; grave ≥ 150 | |
| Bun | mg/dL | normal — a 20; grave ≥ 70 | |
| Cr | mg/dL | H: normal — a 1.3 · M: normal — a 1.1 · grave ≥ 4 | |
| AU | mg/dL | H: normal — a 7 · M: normal — a 6 | |
| Col | mg/dL | normal — a 200 | |
| TG | mg/dL | normal — a 150; grave ≥ 1000 | |
| BT | mg/dL | normal — a 1.2; grave ≥ 6 | |
| BD | mg/dL | normal — a 0.3 | |
| BI | mg/dL | normal — a 1 | |
| PT | g/dL | normal 6 a 8.3 | |
| Glob | g/dL | normal 2 a 3.5 | |
| A/G |  | normal 1 a 2.5 | |
| Alb | g/dL | normal 3.5 a 5; grave < 2 | |
| AST | U/L | normal — a 40; grave ≥ 1000 | |
| ALT | U/L | normal — a 40; grave ≥ 1000 | |
| FA | U/L | normal — a 130 | |
| DHL | U/L | normal — a 250 | |
| GGT | U/L | H: normal — a 60 · M: normal — a 40 | |
| Ca | mg/dL | normal 8.5 a 10.5; grave < 7; grave ≥ 12 | |
| P | mg/dL | normal 2.5 a 4.5; grave < 1; grave ≥ 8 | |
| Cl | mEq/L | normal 98 a 107; grave < 85; grave ≥ 120 | |
| K | mEq/L | normal 3.5 a 5; grave < 3; grave ≥ 6 | |
| Na | mEq/L | normal 135 a 145; grave < 125; grave ≥ 155 | |
| Mg | mg/dL | normal 1.7 a 2.4; grave < 1.2; grave ≥ 4 | |
| PCR | mg/L | normal — a 10; grave ≥ 100 | |
| PCT | ng/mL | normal — a 0.5; grave ≥ 2 | |
| Leu | x10³ | normal 4.5 a 11; grave < 2; grave ≥ 30 | |
| Neu | % | normal 40 a 75 | |
| Eri | x10⁶ | H: normal 4.5 a 5.9 · M: normal 4 a 5.2 | |
| Hb | g/dL | H: normal 13.5 a 17.5 · M: normal 12 a 15.5 · grave < 7; grave ≥ 20 | |
| Hto | % | H: normal 41 a 53 · M: normal 36 a 46 · grave < 21; grave ≥ 60 | |
| VCM | fL | normal 80 a 100 | |
| HCM | pg | normal 27 a 33 | |
| CHCM | g/dL | normal 32 a 36 | |
| RDW | % | normal — a 14.5 | |
| Plaq | x10³ | normal 150 a 450; grave < 50; grave ≥ 1000 | |
| TP | seg | normal — a 14 | |
| INR |  | normal — a 1.2; grave ≥ 5 | |
| TPT | seg | normal — a 35; grave ≥ 100 | |
| Fibrinógeno | mg/dL | normal 200 a 400; grave < 100 | |
| Dímero D | ng/mL | normal — a 500 | |
| pH |  | normal 7.35 a 7.45; grave < 7.2; grave ≥ 7.55 | |
| pCO₂ | mmHg | normal 35 a 45; grave < 20; grave ≥ 70 | |
| pO₂ | mmHg | normal 80 a —; grave < 60 | |
| HCO₃ | mEq/L | normal 22 a 26; grave < 15; grave ≥ 40 | |
| HCO₃std | mEq/L | normal 22 a 26; grave < 15; grave ≥ 40 | |
| TCO₂ | mEq/L | normal 23 a 29; grave < 15; grave ≥ 40 | |
| BEecf |  | normal -2 a 2; grave < -10; grave ≥ 10 | |
| BEb |  | normal -2 a 2; grave < -10; grave ≥ 10 | |
| SO₂ | % | normal 94 a —; grave < 90 | |
| Lactato | mmol/L | normal — a 2; grave ≥ 4 | |
| Ca++ | mmol/L | normal 1.12 a 1.32; grave < 0.9; grave ≥ 1.6 | |
| Na (gas) | mEq/L | normal 135 a 145; grave < 125; grave ≥ 155 | |
| K (gas) | mEq/L | normal 3.5 a 5; grave < 3; grave ≥ 6 | |
| Cl (gas) | mEq/L | normal 98 a 107; grave < 85; grave ≥ 120 | |
| Hb (gas) | g/dL | H: normal 13.5 a 17.5 · M: normal 12 a 15.5 · grave < 7; grave ≥ 20 | |
| Hto (gas) | % | H: normal 41 a 53 · M: normal 36 a 46 · grave < 21; grave ≥ 60 | |
| COHb | % | normal — a 5; grave ≥ 15 | |
| MetHb | % | normal — a 1.5; grave ≥ 10 | |
<!-- /RANGOS -->

## Observaciones de la revisión

- Revisado por: ______________________  Fecha: ______________
- Cambios que pides: 
