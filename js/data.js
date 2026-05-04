let isPlaying = false;
let currentTrack = -1;

let votesA = 0;
let votesB = 0;

const ambientPlaylist = [
  "audio/ambient01.mp3",
  "audio/ambient02.mp3",
  "audio/ambient03.mp3",
  "audio/ambient04.mp3",
  "audio/ambient05.mp3",
  "audio/ambient06.mp3",
  "audio/ambient07.mp3",
  "audio/ambient08.mp3",
  "audio/ambient09.mp3",
  "audio/ambient10.mp3"
];

/*
IMPORTANTE:
Cada línea = { time: SEGUNDOS, text: "letra" }
Tú solo cambias los textos y tiempos luego.
*/

const lyricsData = {

  "audio/ambient01.mp3": [
  { time: 9, text: "Me pregunto cómo estás" },
  { time: 11, text: "Hace pal’ no sé de ti" },
  { time: 14, text: "Veo nuestra conversación y no hablamos desde Abril" },
  { time: 20, text: "Dime cómo a ti te va" },
  { time: 22, text: "Vi esa foto allí en IG" },
  { time: 25, text: "Siempre has sido mi elección" },
  { time: 28, text: "No hay ninguna igual a ti" },

  { time: 31, text: "Solo dime cómo tú estás, baby" },
  { time: 34, text: "Estás más rica" },
  { time: 34.5, text: "Más rica que antes" },
  { time: 36, text: "Me la paso viendo tus fotos" },
  { time: 39, text: "Y no se comparan a las que ahora tú subes" },
  { time: 42, text: "Solo quisiera ir a buscarte" },
  { time: 45, text: "Estás más rica" },
  { time: 45.5, text: "Más rica que antes" },
  { time: 47, text: "Me la paso viendo tus fotos" },
  { time: 50, text: "Y muero por otra vez yo poder probarte" },

  { time: 53, text: "Probarte como pa’ esos tiempos de la high" },
  { time: 55, text: "Vamo’ a darle rewind" },
  { time: 57, text: "A aquellos tiempos que lo hacíamos en cada weekend" },
  { time: 59, text: "Quiero volverte a ver" },
  { time: 60, text: "A tu story le di reply" },
  { time: 62, text: "Es que me dieron ganas de volverte a comer" },
  { time: 64, text: "A to’ esos bobos dile bye" },
  { time: 66, text: "Y vuelve con tu Brace" },
  { time: 68, text: "Hagamos to’ esas cosas que hacíamos en los weekends" },
  { time: 70, text: "Mami, tú te ves divine pa’ ponerte en la pared" },
  { time: 73, text: "Revivamos aquellos tiempos cuando nos tirábamos" },
  { time: 75, text: "En la Calle de Tetuán" },
  { time: 77, text: "Perdidos con el alcohol" },
  { time: 78, text: "Siempre volvíamos, también lo hicimos en El Morro" },
  { time: 81, text: "Ponte pa’ darle rewind" },
  { time: 82, text: "Perdernos en la emoción" },
  { time: 84, text: "Y dale tú, tírame y contéstame" },

  { time: 86, text: "Cómo tú estás, baby?" },
  { time: 88, text: "Estás más rica" },
  { time: 89, text: "Más rica que antes" },
  { time: 91, text: "Me la paso viendo tus fotos" },
  { time: 93, text: "Y no se comparan a las que ahora tú subes" },
  { time: 96, text: "Solo quisiera ir a buscarte" },
  { time: 99, text: "Estás más rica" },
  { time: 100, text: "Más rica que antes" },
  { time: 102, text: "Me la paso viendo tus fotos" },
  { time: 104, text: "Y muero por otra vez yo poder probarte" },

  { time: 107, text: "Recorrer to’ tu cuerpo como tour" },
  { time: 109, text: "Y ver to’ eso que nunca vi" },
  { time: 111, text: "Modélame tus outfits y sin ropa tiéntame" },
  { time: 114, text: "Baja un poco la luz" },
  { time: 115, text: "Ver ese panty Chanel" },
  { time: 116, text: "Estaba loco de comerte" },
  { time: 118, text: "Esta noche quédate" },
  { time: 119, text: "No te vayas aún" },
  { time: 120, text: "Déjame tenerte" },
  { time: 122, text: "Este weekend completo revivir lo que viví" },
  { time: 125, text: "Sabes que siempre has sido tú" },
  { time: 126, text: "Si es por mí, me quedo aquí" },
  { time: 127, text: "Es que me encantas" },
  { time: 128, text: "Y quiero sentirte de lo más profundo" },

  { time: 130, text: "Me pregunto cómo estás" },
  { time: 133, text: "Hace pal’ no sé de ti" },
  { time: 135, text: "Veo nuestra conversación y no hablamos desde Abril" },
  { time: 141, text: "Dime cómo a ti te va" },
  { time: 144, text: "Vi esa foto allí en IG" },
  { time: 146, text: "Siempre has sido mi elección" },
  { time: 149, text: "No hay ninguna igual a ti" },

  { time: 152, text: "Solo dime cómo tú estás, baby" },
  { time: 155, text: "Estás más rica" },
  { time: 156, text: "Más rica que antes" },
  { time: 158, text: "Me la paso viendo tus fotos" },
  { time: 160, text: "Y no se comparan a las que ahora tú subes" },
  { time: 163, text: "Solo quisiera ir a buscarte" },
  { time: 166, text: "Estás más rica" },
  { time: 166.5, text: "Más rica que antes" },
  { time: 168, text: "Me la paso viendo tus fotos" },
  { time: 171, text: "Y muero por otra vez yo poder probarte" },

  { time: 175, text: "Baby" },
  { time: 177, text: "Solo quisiera salir a buscarte" },
  { time: 180, text: "Me la paso viendo tus fotos" },
  { time: 182, text: "Y no se comparan a las que ahora tú subes" },
  { time: 186, text: "Solo quisiera poder ir a buscar…" }
],

  "audio/ambient02.mp3": [
    { time: 0, text: "AMBIENT" },
    { time: 6, text: "Primera línea" },
    { time: 12, text: "Segunda línea" }
  ],

  "audio/ambient03.mp3": [
    { time: 0, text: "TE PASO A BUSCAR" },
    { time: 5, text: "Primera línea" },
    { time: 11, text: "Segunda línea" }
  ],

  "audio/ambient04.mp3": [
    { time: 0, text: "DALE SUAVE" },
    { time: 6, text: "Primera línea" }
  ],

  "audio/ambient05.mp3": [
    { time: 0, text: "DENTRO DE TI" },
    { time: 6, text: "Primera línea" }
  ],

  "audio/ambient06.mp3": [
    { time: 0, text: "MODOLUNA" },
    { time: 6, text: "Primera línea" }
  ],

  "audio/ambient07.mp3": [
    { time: 0, text: "L&P" },
    { time: 6, text: "Primera línea" }
  ],

  "audio/ambient08.mp3": [
    { time: 0, text: "TENTANDO" },
    { time: 6, text: "Primera línea" }
  ],

  "audio/ambient09.mp3": [
    { time: 0, text: "NO ME HAGAS ESPERAR" },
    { time: 6, text: "Primera línea" }
  ],

  "audio/ambient10.mp3": [
    { time: 0, text: "REYNISFJARA" },
    { time: 6, text: "Primera línea" }
  ],

  "audio/TRACK01.mp3": [
    { time: 0, text: "IRME" },
    { time: 5, text: "Primera línea de IRME" },
    { time: 10, text: "Segunda línea de IRME" },
    { time: 15, text: "Tercera línea de IRME" }
  ],
  "audio/chandelier.mp3": [
    { time: 0, text: "Chandelier" },
    { time: 5, text: "Primera línea de IRME" },
    { time: 10, text: "Segunda línea de IRME" },
    { time: 15, text: "Tercera línea de IRME" }
  ]
};

const songsTheme = {
  "audio/TRACK01.mp3": {
    main: "#a855f7",
    second: "#6d28d9"
  },
  "audio/ambient01.mp3": {
    main: "#2200ff",
    second: "#0000db"
  },
  "audio/ambient02.mp3": {
    main: "#2200ff",
    second: "#0000db"
  },
  "audio/ambient03.mp3": {
    main: "#2200ff",
    second: "#0000db"
  },
  "audio/ambient04.mp3": {
    main: "#2200ff",
    second: "#0000db"
  },
  "audio/ambient05.mp3": {
    main: "#2200ff",
    second: "#0000db"
  },
  "audio/ambient06.mp3": {
   main: "#2200ff",
    second: "#0000db"
  },
  "audio/ambient07.mp3": {
    main: "#2200ff",
    second: "#0000db"
  },
  "audio/ambient08.mp3": {
    main: "#2200ff",
    second: "#0000db"
  },
  "audio/ambient09.mp3": {
   main: "#2200ff",
    second: "#0000db"
  },
  "audio/ambient10.mp3": {
    main: "#2200ff",
    second: "#0000db"
  },
  "audio/chandelier.mp3": {
    main:"#d4af37",
    second: "#ffffff"

  }

};

const songCovers = {
  "IRME": "images/irme.PNG",
  "CHaNdeLIER": "images/Chandelier.PNG"
};