# Regla 9 — Aquí no se hacen pantallas genéricas

Navis no puede parecerse a la plantilla de nadie. Si una pantalla se pudiera
pegar tal cual en otro producto cambiándole el logo, está mal hecha. Cada vista
tiene que ser reconociblemente **de esta aplicación**, y eso se decide a
propósito, no sale solo.

> Esta regla es sobre **carácter**. La 7 fija la identidad (el barco, el azul,
> nada de cruces) y la 3 fija los tokens; esta dice qué hacer con ellos para que
> el resultado tenga personalidad en vez de aire de andamio.

## 1. La prueba de la plantilla

Antes de dar por buena una pantalla, hazte estas tres preguntas:

1. **¿Se reconoce sin el logo?** Tapa el logo mentalmente. Si lo que queda
   podría ser un CRM, un panel de facturación o un SaaS cualquiera, falta
   decisión.
2. **¿Hay una cosa que recordar?** Una pantalla bien hecha deja un elemento en
   la cabeza: un gesto, una composición, un detalle. Si no lo tiene, es
   mobiliario.
3. **¿Por qué está así?** Cada elección —el corte del layout, el peso del
   titular, dónde cae el acento— tiene que poder explicarse con una frase. «Es
   lo normal» no es una explicación.

Si falla alguna, todavía no está.

## 2. Lo que aquí se lee como genérico

Salidas por defecto que hay que evitar salvo que haya un motivo escrito:

- **La tarjeta centrada y sola** sobre un fondo vacío, con el logo encima y tres
  campos debajo. Es el formulario de acceso de todo el mundo.
- **Degradados de relleno**: la malla de colores difuminada, el `blur` gigante
  de fondo, la aurora morada. Decoran para no dejar hueco, y no dicen nada.
- **Iconos como adorno**: un icono junto a cada apartado porque quedaba pobre.
  Un icono está para localizar algo más rápido, no para llenar.
- **Emoji de icono.** Nunca. Los iconos son SVG (lucide en web, Ionicons en
  móvil), y pasan por el filtro de la Regla 7.
- **Numeritos 01 / 02 / 03** y demás andamiaje ordinal cuando el contenido no es
  una secuencia real.
- **Tipografía sin decidir**: todo en el mismo peso y el mismo tamaño, con el
  titular apenas más grande que el cuerpo.
- **Sombras por todas partes** para simular jerarquía que no existe.
- **Copia de relleno**: «Bienvenido de nuevo», «Gestiona todo en un solo sitio»,
  «Potencia tu productividad». Si vale para cualquier producto, no vale para
  este.
- **Animar por animar**: cosas que rebotan, aparecen y flotan sin que aporten
  información ni continuidad.

## 3. De dónde sale el carácter

De la materia del proyecto, no del catálogo de tendencias. Navis es una nave:
hay cartas náuticas, rumbos, sondas, cuadernos de bitácora, horizontes, estelas.
Y es trabajo pastoral: acompañar personas a lo largo del tiempo, con calma y
cuidado. Ahí está el vocabulario visual, y sale gratis porque ya es verdad.

Cuatro sitios donde gastar la decisión:

| Palanca         | Qué se decide                                                       |
| --------------- | ------------------------------------------------------------------- |
| **Composición** | El corte de la pantalla. Un panel de marca, una asimetría, un ritmo |
| **Tipografía**  | Escala con saltos de verdad, pesos y `tracking` elegidos            |
| **Movimiento**  | Una secuencia orquestada al entrar, no efectos sueltos              |
| **Firma**       | El elemento que se recuerda. Uno por pantalla, y con motivo         |

## 4. Una audacia por pantalla, no cinco

El resto acompaña en voz baja. Si todo grita, no se oye nada: elige el elemento
firma, y deja lo demás disciplinado —espaciado regular, tipografía sobria,
colores de token—. Antes de darlo por terminado, quita un adorno.

## 5. El listón no se baja por hacerlo bonito

La personalidad se construye **encima** del suelo de calidad, nunca a su costa:

- Contraste que cumple en claro y en oscuro (Regla 3).
- Foco visible por teclado, roles y etiquetas accesibles (Reglas 2 y 5).
- `prefers-reduced-motion` respetado: sin él, la animación es un problema de
  accesibilidad, no un detalle.
- Solo se anima lo que el compositor sabe animar: `opacity` y `transform`. Nada
  de `width`, `height`, `top` ni `filter` en bucle.
- Funciona a 375 px con el texto en alemán (Reglas 2 y 5).

Una pantalla con carácter que no se puede usar con el teclado no es original:
está rota.

## 6. La copia también es diseño

El texto se escribe para orientar, no para adornar. En la voz de la aplicación,
en presente, en frases cortas, diciendo qué pasa y qué hacer. El botón que dice
«Crear cuenta» produce «Cuenta creada», y el mismo nombre se mantiene en todo el
recorrido. Un error dice qué ha fallado y cómo se arregla; una pantalla vacía
invita a hacer algo. Y todo eso, en los seis idiomas (Regla 2).

## 7. Reutiliza el carácter, no lo reinventes

Lo contrario de genérico no es que cada pantalla vaya por su cuenta. Cuando una
decisión funciona —la transición de página, el panel de marca, el ritmo de
entrada de un formulario—, se saca a un componente y se usa en todas partes
(Regla 1). Lo auténtico es el conjunto: una aplicación con voz propia, no seis
pantallas que compiten entre ellas.

## 8. Antes de darlo por hecho

- ¿Pasa las tres preguntas del punto 1?
- ¿Cuál es el elemento firma, y hay **uno** y no cinco?
- ¿Ninguna elección está en la lista del punto 2 sin motivo escrito?
- ¿La copia habla de este producto y no de cualquiera?
- ¿Sigue cumpliendo contraste, foco, `reduced-motion` y 375 px?

> Si podría ser la pantalla de otro producto, todavía no es la nuestra.
