import type { NewsletterDraft } from "./types";

export const sampleDraft: NewsletterDraft = {
  logoSrc: "/assets/logo.png",
  taglineSrc: "/assets/tagline.png",
  coverSrc: "/assets/cover.jpg",
  coverAlt: "Portret stylisé van Jeroen Brouwers bij een open boek",
  label: "CHAPTER TWO",
  title: "<p><em>Brouwers: ‘Niets bestaat dat niet iets anders aanraakt’ .</em></p>",
  blocks: [
    {
      id: "p1",
      type: "paragraph",
      html: "<p>Jeroen Brouwers wist niet tot wat het zou leiden.<br>Die zin. En onbedoeld schreef hij een van de meest geciteerde zinnen uit de Nederlandse taal. Ook is het een van de meest waarachtige en hoopvolle zinnen van ze allemaal. Het is waarom we hem willen onthouden en koesteren. En dat ze komt vanwaar ze komt, van de schrijver die hij was, maakt hem alleen maar nog meer bijzonder.</p>",
    },
    {
      id: "p2",
      type: "paragraph",
      html: "<p>Brouwers was niet de grote optimist, de belijder van de hoop. Daarvoor was hij te lang een journalist en zat hij te veel gevangen in zijn verleden. Hij was een nogal donkere en vaak cynische schrijver. Als kind verbleef hij in een Japans gevangenenkamp in Indonesië. In zijn boek, <em>Bezonken Rood</em>, schreef hij daarover. Hij schreef er zijn herinneringen neer: zijn mager geworden moeder, de slagen, de honger, de vijandschap, de pijn, ook het verlies van zijn grootouders. Het werd, naast alle andere zinnen in dit boek, ook deze zin: ‘Niets bestaat dat niet iets anders aanraakt’ .</p>",
    },
    {
      id: "img1",
      type: "image",
      src: "/assets/image-1.jpg",
      alt: "Line drawing of a figure",
    },
    {
      id: "p3",
      type: "paragraph",
      html: "<p>Te midden van dit zwarte boek staat enkele keren deze zin. En ze is anders. Anders dan de andere zinnen. Misschien ligt ze wel dichter bij het leven; dichter dan zelfs taal ooit tot dusver toestond. Deze zin leidt een eigen leven, van Brouwers, tot deze brief, tot nog verder. Ze werd bedacht, werd geschreven en getikt tijdens een droefgeestige herinnering. Ze werd gedrukt, in inkt gelegd. En ze ging over de tongen, werd geciteerd, het werd een van de meest geciteerde zinnen, het werd een spreekwoord, of toch bijna, voor duizend-en-een dingen, en bevestigde aldus haar betekenis:</p>",
    },
    {
      id: "p4",
      type: "paragraph",
      html: "<p>Het leidde precies tot datgene wat de zin, en wat ‘aanraking’, inhoudt: dat elke uitkomst, waar het ook begint, onzeker is. En dat maakt het zo ‘levensgroot’, en dat maakt het ook zo hoopvol.</p>",
    },
    {
      id: "p5",
      type: "paragraph",
      html: "<p>Iets raakt altijd iets anders aan. Dat andere raakt op zijn beurt ook weer iets aan, en dat andere-andere ook weer. Ga zo maar door, tot in het oneindige. Zo is elke ramp of tegenslag, hoe zwart, verloren, verdrietig en pijnlijk die ook is, ook rechtstreeks of onrechtstreeks (lees: snel of traag), verbonden met de keerzijde. Het maakt dat in alles nog hoop ligt, zolang onze perceptie verder gaat dan hetgeen waarin we nu verkeren.</p>",
    },
    {
      id: "p6",
      type: "paragraph",
      html: "<p>Aanrakingen zijn niet alleen het tastbare, maar vooral ook het onzichtbare, ongrijpbare en onberekenbare vervolg daarvan. Terwijl ik dit schrijf, en het ergens rake en regent, voltrekt zich ook precies dat.</p>",
    },
    {
      id: "img2",
      type: "image",
      src: "/assets/image-2.png",
      alt: "Line drawing of figures",
    },
    {
      id: "p7",
      type: "paragraph",
      html: "<p>Als redactie van Goe Nieuws, als open collectief, willen we ons ten allen tijde bewust zijn van deze schakels. Elk klein artikel, elke kleinste zin, elke kleinste foto en daad bezit de allergrootste mogelijkheid, zowel tot het goede als tot het kwade, tot het onbekende. We houden rekening met heersende onrechtvaardigheden, met chaos en onzekerheid, en willen daarin de aanwezige hoop belichamen.</p>",
    },
    {
      id: "p8",
      type: "paragraph",
      html: "<p><em>Bezonken Rood. Ah, ziedaar, op het onverwachte weet ik het weer. Ik besta uit de noodzaak om mijn bloed te doen stromen. Dat ik mijzelf soms aanraak, heel hard masturbeer, soms zomaar over mijn handen streel, is uit noodzaak mijn bloed te doen stromen. Als ik het kon, zou ik met mijn hand mijn hart vastnemen, graaien in mijn borst, en het sneller en harder en onregelmatiger doen slaan. Om te voelen dat ik leef. Dat is soms zo.. Het bloed dat warm uitloopt over mijn vingers, ik bekijk ze, hou ze als een waaier voor mijn ogen. Dat ontbreekt soms zo.</em></p>",
    },
    {
      id: "p9",
      type: "paragraph",
      html: "<p>Alexander</p>",
    },
  ],
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/goe.nieuws/" },
  ],
  footerNote:
    "Je ontvangt deze mail omdat je deel uitmaakt van de Goe Nieuws community.",
  colors: {
    backgroundCard: "#ffffff",
    backgroundOuter: "#f3f3f3",
    logo: "#000000",
    tagline: "#000000",
    label: "#000000",
    title: "#000000",
    body: "#000000",
    footer: "#333333",
    footerRule: "#000000",
  },
  typography: {
    label: { fontSize: 20, lineHeight: 1.35 },
    title: { fontSize: 43, lineHeight: 1 },
    body: { fontSize: 25, lineHeight: 1.35 },
    footer: { fontSize: 15, lineHeight: 1.45 },
  },
};
