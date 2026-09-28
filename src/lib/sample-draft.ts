import type { NewsletterDraft } from "./types";
import {
  defaultColors,
  defaultSpacing,
  defaultTypography,
} from "./types";

/**
 * Sample measured from Figma file GOOD-NEWS / CLEAN FOR AI / frame 123:404 (458×8479).
 * Spacings = Y deltas between consecutive layers.
 */
export const sampleDraft: NewsletterDraft = {
  subject: "Goe Nieuws — Seizoen 01 · Aanraking",
  dividerSrc: "/assets/divider-dots.png",
  sections: [
    {
      id: "sec-header",
      font: "sans",
      blocks: [
        {
          id: "logo",
          type: "image",
          src: "/assets/logo-goe.png",
          alt: "Goe Nieuws / Good News",
          width: 423,
          // Figma: y=8, h≈119
          spacing: { top: 8, bottom: 0 },
        },
        {
          id: "meta",
          type: "meta",
          left: "SEIZOEN 01 — AANRAKING",
          right: "NIEUWSBRIEF 01",
          // Figma meta y=114 → figures (419) y=172 → gap 21 after meta box (h=37)
          spacing: { top: 0, bottom: 21 },
        },
        {
          id: "figures",
          type: "image",
          src: "/assets/illust-figures.png",
          alt: "Vier figuren — lijntekening",
          width: 418,
          // Figma Capture 419: y=172 h=348 → intro y=536 → gap 16
          spacing: { top: 0, bottom: 16 },
        },
        {
          id: "intro",
          type: "text",
          align: "center",
          font: "sans",
          // Inherits typography.sansSize — italic on brand + theme word
          html: "<p><em>Goe Nieuws</em> is een collectief opgestart door een groep vrienden op zoek naar eigenzinnige perspectieven die ons aanzetten tot reflectie en actie. Positiviteit is een cruciale remedie voor de alomtegenwoordige hopeloosheid. Als Goe Nieuws zijn we van mening dat het anders kan, en geloven we met overtuiging in de transformatieve kracht van mensen en verhalen. Als eerste thema gaan we aan de slag met <em>aanraking</em>.</p>",
          // intro ends ~791, divider y=811 → 20
          spacing: { top: 0, bottom: 0 },
        },
        {
          id: "div-header",
          type: "divider",
          spacing: { top: 20, bottom: 20 },
        },
      ],
    },
    {
      id: "sec-brouwer",
      font: "serif",
      blocks: [
        {
          id: "brouwer-illust",
          type: "image",
          src: "/assets/illust-brouwer.png",
          alt: "Portret bij een open boek",
          width: 387,
          // Figma vector 488: after divider; small gap then title
          spacing: { top: 12, bottom: 13 },
        },
        {
          id: "brouwer-title",
          type: "image",
          src: "/assets/title-brouwer.png",
          alt: "Brouwers — handwritten title",
          width: 284,
          spacing: { top: 0, bottom: 13 },
        },
        {
          id: "b1",
          type: "text",
          html: "<p>Jeroen Brouwers wist niet tot wat het zou leiden.<br />Die zin. En onbedoeld schreef hij een van de meest geciteerde zinnen uit de Nederlandse taal. Ook is het een van de meest waarachtige en hoopvolle zinnen van ze allemaal. Het is waarom we hem willen onthouden en koesteren. En dat ze komt vanwaar ze komt, van de schrijver die hij was, maakt hem alleen maar nog meer bijzonder.</p>",
          spacing: { top: 0, bottom: 23 },
        },
        {
          id: "b2",
          type: "text",
          html: "<p>Brouwers was niet de grote optimist, de belijder van de hoop. Daarvoor was hij te lang een journalist en zat hij te veel gevangen in zijn verleden. Hij was een nogal donkere en vaak cynische schrijver. Als kind verbleef hij in een Japans gevangenenkamp in Indonesië. In zijn boek, Bezonken Rood, schreef hij daarover. Hij schreef er zijn herinneringen neer: zijn mager geworden moeder, de slagen, de honger, de vijandschap, de pijn, ook het verlies van zijn grootouders. Het werd, naast alle andere zinnen in dit boek, ook deze zin: ‘Niets bestaat dat niet iets anders aanraakt’ .</p>",
          spacing: { top: 0, bottom: 23 },
        },
        {
          id: "b3",
          type: "text",
          html: "<p>Te midden van dit zwarte boek staat enkele keren deze zin. En ze is anders. Anders dan de andere zinnen. Misschien ligt ze wel dichter bij het leven; dichter dan zelfs taal ooit tot dusver toestond. Deze zin leidt een eigen leven, van Brouwers, tot deze brief, tot nog verder. Ze werd bedacht, werd geschreven en getikt tijdens een droefgeestige herinnering. Ze werd gedrukt, in inkt gelegd. En ze ging over de tongen, werd geciteerd, het werd een van de meest geciteerde zinnen, het werd een spreekwoord, of toch bijna, voor duizend-en-een dingen, en bevestigde aldus haar betekenis:</p>",
          spacing: { top: 0, bottom: 0 },
        },
        {
          id: "b4",
          type: "text",
          html: "<p>Het leidde precies tot datgene wat de zin, en wat ‘aanraking’, inhoudt: dat elke uitkomst, waar het ook begint, onzeker is. En dat maakt het zo ‘levensgroot’, en dat maakt het ook zo hoopvol.</p>",
          spacing: { top: 0, bottom: 23 },
        },
        {
          id: "b5",
          type: "text",
          html: "<p>Iets raakt altijd iets anders aan. Dat andere raakt op zijn beurt ook weer iets aan, en dat andere-andere ook weer. Ga zo maar door, tot in het oneindige. Zo is elke ramp of tegenslag, hoe zwart, verloren, verdrietig en pijnlijk die ook is, ook rechtstreeks of onrechtstreeks (lees: snel of traag), verbonden met de keerzijde. Het maakt dat in alles nog hoop ligt, zolang onze perceptie verder gaat dan hetgeen waarin we nu verkeren.</p>",
          spacing: { top: 0, bottom: 23 },
        },
        {
          id: "b6",
          type: "text",
          html: "<p>Aanrakingen zijn niet alleen het tastbare, maar vooral ook het onzichtbare, ongrijpbare en onberekenbare vervolg daarvan. Terwijl ik dit schrijf, en het ergens rake en regent, voltrekt zich ook precies dat.</p>",
          spacing: { top: 0, bottom: 23 },
        },
        {
          id: "b7",
          type: "text",
          html: "<p>Als redactie van Goe Nieuws, als open collectief, willen we ons ten allen tijde bewust zijn van deze schakels. Elk klein artikel, elke kleinste zin, elke kleinste foto en daad bezit de allergrootste mogelijkheid, zowel tot het goede als tot het kwade, tot het onbekende. We houden rekening met heersende onrechtvaardigheden, met chaos en onzekerheid, en willen daarin de aanwezige hoop belichamen.</p>",
          spacing: { top: 0, bottom: 23 },
        },
        {
          id: "b8",
          type: "text",
          html: "<p><em>Bezonken Rood. Ah, ziedaar, op het onverwachte weet ik het weer. Ik besta uit de noodzaak om mijn bloed te doen stromen. Dat ik mijzelf soms aanraak, heel hard masturbeer, soms zomaar over mijn handen streel, is uit noodzaak mijn bloed te doen stromen. Als ik het kon, zou ik met mijn hand mijn hart vastnemen, graaien in mijn borst, en het sneller en harder en onregelmatiger doen slaan. Om te voelen dat ik leef. Dat is soms zo.. Het bloed dat warm uitloopt over mijn vingers, ik bekijk ze, hou ze als een waaier voor mijn ogen. Dat ontbreekt soms zo.</em></p>",
          spacing: { top: 0, bottom: 23 },
        },
        {
          id: "b-sig",
          type: "text",
          html: "<p>Alexander</p>",
          spacing: { top: 0, bottom: 0 },
        },
        {
          id: "div-brouwer",
          type: "divider",
          spacing: { top: 20, bottom: 20 },
        },
      ],
    },
    {
      // Anatomie body is Georgia 17/23 in Figma (not sans)
      id: "sec-anatomie",
      font: "serif",
      blocks: [
        {
          id: "a-img1",
          type: "image",
          src: "/assets/photo-hand-1.jpg",
          alt: "Hand tegen de lucht",
          width: 402,
          // divider y=3646 → photo y=3684 → 38
          spacing: { top: 18, bottom: 24 },
        },
        {
          id: "a-title",
          type: "framedTitle",
          html: "<p>Anatomie van aanraking</p>",
          // photo end 3952 → title 4105 ≈ 153 (Figma), tighten slightly for empty rect
          spacing: { top: 40, bottom: 24 },
        },
        {
          id: "a-t1",
          type: "text",
          html: "<p>Een lichaam is de plaats van alle aanrakingen. Dat van een mens is als een spons met gangen, wegen en doorwaadbare kamers, eindeloos complex. Goe Nieuws probeert het lichaam zoals we het kennen te vergeten, opnieuw te ontleden en te herontdekken, te beginnen bij… een hand.</p>",
          spacing: { top: 0, bottom: 23 },
        },
        {
          id: "a-img2",
          type: "image",
          src: "/assets/photo-hand-2.jpg",
          alt: "Handen met zaden",
          width: 401,
          spacing: { top: 12, bottom: 23 },
        },
        {
          id: "a-t2",
          type: "text",
          html: "<p>(Zachte doorsnede, zonder mes.)</p>",
          spacing: { top: 0, bottom: 23 },
        },
        {
          id: "a-t3",
          type: "text",
          html: "<p>Is een hand een opslagkamer?<br />Waarmee vullen de knokkels zich naarmate we ouder worden?</p>",
          spacing: { top: 0, bottom: 23 },
        },
        {
          id: "a-t4",
          type: "text",
          html: "<p>Of is het slechts het weefsel tussenin dat verdwijnt, die ze doet uitsteken.</p>",
          spacing: { top: 0, bottom: 23 },
        },
        {
          id: "a-img3",
          type: "image",
          src: "/assets/photo-hand-3.jpg",
          alt: "Twee handen",
          width: 401,
          spacing: { top: 12, bottom: 23 },
        },
        {
          id: "a-t5",
          type: "text",
          html: "<p>Groeien onze knokkels niet mee met het besef van onze eigen vergankelijkheid?<br />(groter-steeds-groter )</p>",
          spacing: { top: 0, bottom: 23 },
        },
        {
          id: "a-t6",
          type: "text",
          html: "<p>Vullen ze zich niet met herinneringen van zodra ons geheugen het soms laat afweten?</p>",
          spacing: { top: 0, bottom: 23 },
        },
        {
          id: "a-t7",
          type: "text",
          html: "<p>Of herinneren ze zich alles eerder al, veel eerder.</p>",
          spacing: { top: 0, bottom: 23 },
        },
        {
          id: "a-img4",
          type: "image",
          src: "/assets/photo-hand-4.jpg",
          alt: "Handen dicht bij elkaar",
          width: 401,
          spacing: { top: 12, bottom: 23 },
        },
        {
          id: "a-t8",
          type: "text",
          html: "<p>Ik bedenk mij: dat de handen zich nog herinneren, wat mijn hoofd soms nalaat. En terwijl ik mij dit bedenk: een pulserende groene ader, over de knokkel van mijn wijsvinger.</p>",
          spacing: { top: 0, bottom: 23 },
        },
        {
          id: "a-t9",
          type: "text",
          html: "<p>Zolang ik leef, volg ik deze kleuren terug, ja ook in mijn eigen uitgeteerde handen als het ooit zo ver komt, met de jaren mee, naar de allervroegste herinnering van de mens.</p>",
          spacing: { top: 0, bottom: 0 },
        },
        {
          id: "div-anatomie",
          type: "divider",
          spacing: { top: 20, bottom: 20 },
        },
      ],
    },
    {
      id: "sec-closing",
      font: "sans",
      blocks: [
        {
          id: "gn",
          type: "image",
          src: "/assets/logo-gn.png",
          alt: "G… N…",
          width: 408,
          spacing: { top: 24, bottom: 20 },
        },
        {
          id: "close",
          type: "text",
          align: "center",
          font: "sans",
          html: "<p>Elke zes maanden gaan we als collectief aan de slag met een nieuw thema en zoeken we naar verhalen, evenementen en acties die we met jullie willen delen. Samen hopen we zo onderbelichte perspectieven hun spreekwoordelijk momentje in de zon te gunnen. In onze nieuwsbrief krijg je dan ook deze verhalen te lezen, en hopen we samen met jullie onze community uit te bouwen.</p><p><br /></p><p>Veel leesplezier, en bij deze een uitgereikte hand om samen met ons verder te werken aan dit verhaal.</p><p><br /></p><p>Team Goe Nieuws</p>",
          spacing: { top: 0, bottom: 0 },
        },
        {
          id: "div-closing",
          type: "divider",
          spacing: { top: 20, bottom: 20 },
        },
      ],
    },
  ],
  footer: {
    dark: true,
    tagline:
      "gemeenschap voor reflectie en actie — community for reflection and action",
    logoSrc: "/assets/logo-goe.png",
    note: "Je ontvangt deze mail omdat je deel uitmaakt van de Goe Nieuws community.",
    links: [
      { label: "Instagram", href: "https://www.instagram.com/goe.nieuws/" },
      { label: "Facebook", href: "https://www.facebook.com/" },
      { label: "Website", href: "https://goenieuws.be/" },
    ],
  },
  colors: defaultColors,
  spacing: defaultSpacing,
  typography: defaultTypography,
};
