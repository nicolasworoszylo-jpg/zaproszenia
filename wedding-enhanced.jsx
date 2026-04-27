import { useState, useEffect, useRef, useCallback } from "react";

const CONFIG = {
  bride: "Anna", groom: "Michał",
  weddingDate: new Date("2026-06-20T15:00:00"),
  quote: "Każda wielka miłość zaczyna się od jednego spojrzenia",
  rsvpDeadline: "20 maja 2026",
  ceremony: { title: "Ceremonia ślubna", time: "15:00", venue: "Kościół św. Anny", address: "ul. Krakowskie Przedmieście 68, Warszawa", mapUrl: "https://www.google.com/maps/search/?api=1&query=Ko%C5%9Bci%C3%B3%C5%82+akademicki+%C5%9Bw.+Anny+Warszawa+Krakowskie+Przedmie%C5%9Bcie+68" },
  reception: { title: "Przyjęcie weselne", time: "17:00", venue: "Pałac w Korczewie", address: "Korczew 23, 08-108 Korczew", mapUrl: "https://www.google.com/maps/search/?api=1&query=Pa%C5%82ac+w+Korczewie" },
  timeline: [
    { time: "15:00", event: "Ceremonia ślubna", desc: "Kościół św. Anny w Warszawie", icon: "church" },
    { time: "16:30", event: "Sesja & koktajl", desc: "Czas na zdjęcia i lampkę szampana", icon: "camera" },
    { time: "17:30", event: "Obiad weselny", desc: "Uroczysta kolacja w Pałacu w Korczewie", icon: "dinner" },
    { time: "20:00", event: "Tort & pierwszy taniec", desc: "Najsłodszy moment wieczoru", icon: "cake" },
    { time: "21:00", event: "Zabawa!", desc: "Parkiet czeka na Was", icon: "party" },
  ],
  ourStory: [
    { date: "Wrzesień 2019", title: "Pierwsze spojrzenie", text: "Spotkaliśmy się na koncercie w Stodole. Michał rozlał na Annę piwo - i tak zaczęła się nasza historia." },
    { date: "Grudzień 2019", title: "Pierwsza randka", text: "Spacer po Łazienkach zakończony gorącą czekoladą. Gadaliśmy do zamknięcia kawiarni." },
    { date: "Lato 2021", title: "Wspólne mieszkanie", text: "Przeprowadzka na Pragę. Pierwsze meble z IKEA i pierwszy wspólny kot - Mruczek." },
    { date: "Luty 2025", title: "Zaręczyny", text: "Na szczycie Giewontu, w śniegu, z pierścionkiem w kieszeni kurtki. Powiedziała TAK!" },
  ],
  ourStoryPhotos: null,
  ourStoryHeartPhoto: null,
  dressCode: { main: "Elegancko - garnitury i sukienki koktajlowe.", note: "Prosimy o unikanie bieli - ten kolor zarezerwowany dla Panny Młodej.", colors: ["#8B6F47","#C4A77D","#6B7B5E","#2C3E2D","#D4A373"] },
  transport: { departure: "Autokar o 14:00 spod Dworca Centralnego (wejście od ul. Emilii Plater).", ret: "Powrót o 2:00 w nocy na Dworzec Centralny." },
  hotels: [
    { name: "Hotel Hetman", distance: "20 min od sali (Siedlce)", price: "od 290 zł/noc", mapUrl: "https://www.google.com/maps/search/?api=1&query=Hotel+Hetman+Siedlce" },
    { name: "Pensjonat Korczewski", distance: "5 min od sali", price: "od 180 zł/noc", mapUrl: "https://www.google.com/maps/search/?api=1&query=noclegi+Korczew+gmina" },
  ],
  faq: [
    { q: "Czy mogę przyjść z dzieckiem?", a: "Oczywiście! Będzie animatorka dla dzieci i kącik zabaw." },
    { q: "Czy jest parking przy sali?", a: "Tak, darmowy parking na terenie Pałacu w Korczewie - ponad 100 miejsc." },
    { q: "Do kiedy potwierdzić obecność?", a: "Prosimy o potwierdzenie do 20 maja 2026." },
    { q: "Czy mogę zabrać osobę towarzyszącą?", a: "Zaproszenie dotyczy osób wskazanych z imienia. W razie wątpliwości - napiszcie do nas." },
  ],
  gifts: "Waszą obecność uważamy za największy prezent. Jeśli jednak chcecie nas wesprzeć w budowaniu wspólnego gniazdka:",
  accounts: [
    { iban: "PL 61 1090 1014 0000 0712 1981 2874", holder: "Anna Kowalska" },
    { iban: "PL 42 1160 2202 0000 0003 5612 7890", holder: "Michał Kowalski" },
  ],
  guestPhotosUrl: "https://drive.google.com/drive/folders/XXXXX",
  photographerGalleryUrl: "https://drive.google.com/drive/folders/YYYYY",
  bgMusicUrl: null,
  bgMusicTitle: "Nasza piosenka",
  venueBrand: "zaproszeniaonline.com", venueUrl: "/",
  calendarTitle: "Ślub Anny i Michała",
  calendarLocation: "Pałac w Korczewie, Korczew 23, 08-108 Korczew",
};

const C = { forest:"#2C3E2D", deep:"#1E2B1F", gold:"#C9A96E", goldL:"#D4B97F", warm:"#FAF6EF", cream:"#F5EDE0", parch:"#EDE4D3", stone:"#A09888", char:"#2A2622", bark:"#6B5D4F" };
const F = { display: "'Playfair Display',Georgia,serif", body: "'Cormorant Garamond',Georgia,serif", mono: "'DM Mono','Courier New',monospace" };

/* ═══ UDOSKONALENIE #7: Spring easing cubic-bezier (z sekcji 7 raportu - linear() approx) ═══ */
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const EASE_OUT_EXPO = "cubic-bezier(0.16, 1, 0.3, 1)";

function useCountdown(d){const[t,s]=useState({d:0,h:0,m:0,s:0,past:false});useEffect(()=>{const f=()=>{const x=d.getTime()-Date.now();if(x<=0){s({d:0,h:0,m:0,s:0,past:true});return}s({d:Math.floor(x/864e5),h:Math.floor(x%864e5/36e5),m:Math.floor(x%36e5/6e4),s:Math.floor(x%6e4/1e3),past:false})};f();const id=setInterval(f,1e3);return()=>clearInterval(id)},[d]);return t}
function useInView(th=0.1){const r=useRef(null),[v,s]=useState(false);useEffect(()=>{const e=r.current;if(!e)return;const o=new IntersectionObserver(([x])=>{if(x.isIntersecting)s(true)},{threshold:th});o.observe(e);return()=>o.disconnect()},[th]);return[r,v]}

function Reveal({children,delay=0,y=32,style={}}){const[r,v]=useInView(0.08);return(<div ref={r} style={{opacity:v?1:0,transform:v?"none":`translateY(${y}px)`,transition:`opacity .9s ${EASE_OUT_EXPO} ${delay}s, transform .9s ${EASE_OUT_EXPO} ${delay}s`,...style}}>{children}</div>)}

let _gid=0;
function Grain({o=.03}){const[id]=useState(()=>"gfx"+(_gid++));return(<svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",opacity:o,mixBlendMode:"overlay"}}><filter id={id}><feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter={`url(#${id})`}/></svg>)}

/* ═══ UDOSKONALENIE #8: Shimmer sweep na gold dividerach ═══ */
function GoldDiv({w=100,m=32,animated=false}){return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,margin:`${m}px 0`,position:"relative"}}><div style={{width:w*.4,height:1,background:`linear-gradient(to right,transparent,${C.gold}60)`}}/><svg width="8" height="8" viewBox="0 0 8 8" style={animated?{animation:"spinDiamond 8s linear infinite"}:{}}><rect x="1.5" y="1.5" width="5" height="5" transform="rotate(45 4 4)" stroke={C.gold} strokeWidth=".7" fill="none"/></svg><div style={{width:w*.4,height:1,background:`linear-gradient(to left,transparent,${C.gold}60)`}}/></div>)}
function Label({children}){return (<p style={{fontFamily:F.body,fontSize:14,letterSpacing:6,textTransform:"uppercase",color:C.gold,marginBottom:10,fontWeight:500}}>{children}</p>)}
function Title({children,color=C.forest,size="clamp(32px,7vw,46px)"}){return (<h2 style={{fontFamily:F.display,fontSize:size,fontWeight:400,fontStyle:"italic",color,margin:"0 0 12px",lineHeight:1.15}}>{children}</h2>)}

/* ═══ UDOSKONALENIE #4: Spring easing na przyciskach + shimmer na filled ═══ */
function Btn({children,href,onClick,filled,full,style:ex={}}){const[h,sH]=useState(false);const s={display:"inline-block",fontFamily:F.body,fontSize:14,fontWeight:600,letterSpacing:4,textTransform:"uppercase",padding:"14px clamp(20px,4vw,34px)",border:`1px solid ${filled?C.gold:C.forest}`,background:filled?(h?C.goldL:C.gold):(h?C.forest:"transparent"),color:filled?C.char:(h?C.warm:C.forest),textDecoration:"none",cursor:"pointer",transition:`all .4s ${SPRING}`,transform:h?"translateY(-2px)":"translateY(0)",boxShadow:h?(filled?`0 6px 24px ${C.gold}30`:`0 4px 16px rgba(0,0,0,.08)`):"none",width:full?"100%":"auto",textAlign:"center",maxWidth:"100%",boxSizing:"border-box",position:"relative",overflow:"hidden",...ex};const ev={onMouseEnter:()=>sH(true),onMouseLeave:()=>sH(false)};
  const shimmer = filled ? <div style={{position:"absolute",inset:0,background:`linear-gradient(105deg,transparent 40%,rgba(255,255,255,.2) 50%,transparent 60%)`,animation:"shimmer 3s ease-in-out infinite",pointerEvents:"none"}}/> : null;
  if(href)return (<a href={href} target="_blank" rel="noopener" style={s} {...ev}>{shimmer}{children}</a>);return (<button onClick={onClick} style={s} {...ev}>{shimmer}{children}</button>)}
function Branch({w=140,o=.35}){return (<svg viewBox="0 0 200 24" fill="none" style={{width:w,opacity:o,display:"block",margin:"0 auto"}}><path d="M5 12C30 12 50 8 70 11C90 14 110 6 130 10C150 14 170 8 195 12" stroke={C.gold} strokeWidth=".6"/>{[40,75,110,145].map((x,i)=>(<g key={i}><path d={`M${x} ${10+i%2*2}C${x-5} ${3+i%2*3} ${x-12} ${1+i%2*2} ${x-15} ${2+i%2}`} stroke={C.gold} strokeWidth=".4" fill="none"/><circle cx={x-15} cy={2+i%2} r={1.5+i%2*.5} fill={`${C.gold}25`}/></g>))}</svg>)}
function Corner({flip}){return (<svg viewBox="0 0 80 80" fill="none" style={{width:70,height:70,transform:flip,opacity:.45}}><path d="M4 76C4 40 12 20 24 12C36 4 56 2 76 4" stroke={C.gold} strokeWidth=".6"/><path d="M8 72C10 44 18 26 28 18C38 10 54 6 72 6" stroke={C.gold} strokeWidth=".3" opacity=".5"/><circle cx="76" cy="4" r="1.5" fill={`${C.gold}30`}/><circle cx="4" cy="76" r="1.5" fill={`${C.gold}30`}/></svg>)}

function PhotoPlaceholder({shape="rect",w=120,h=160,label="miejsce na zdjęcie"}){
  if(shape==="heart")return (<div style={{width:w,height:w,margin:"0 auto",position:"relative"}}>
    <svg viewBox="0 0 100 100" style={{width:"100%",height:"100%"}}><defs><clipPath id="heartClip"><path d="M50 88L10 50C-2 38-2 20 10 10C22 0 38 2 50 18C62 2 78 0 90 10C102 20 102 38 90 50L50 88Z"/></clipPath></defs><rect width="100" height="100" clipPath="url(#heartClip)" fill={`${C.parch}60`} stroke={C.gold} strokeWidth="0"/><text x="50" y="48" textAnchor="middle" fontFamily={F.body} fontSize="7" fill={C.stone} letterSpacing="1">{label}</text><text x="50" y="58" textAnchor="middle" fontFamily={F.body} fontSize="5" fill={`${C.stone}80`}>&#x2661;</text></svg>
  </div>);
  return (<div style={{width:w,height:h,border:`1px dashed ${C.gold}30`,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",background:`${C.parch}30`,flexDirection:"column",gap:4}}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={`${C.gold}50`} strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15L16 10L5 21"/></svg>
    <span style={{fontFamily:F.body,fontSize:10,color:`${C.stone}80`,letterSpacing:1,textTransform:"uppercase"}}>{label}</span>
  </div>);
}

const TLIcons={church:<svg viewBox="0 0 28 28" fill="none" stroke={C.gold} strokeWidth="1"><path d="M14 2V7M11 4.5H17M7 12L14 7L21 12V24H7V12Z"/><rect x="11" y="18" width="6" height="6"/></svg>,camera:<svg viewBox="0 0 28 28" fill="none" stroke={C.gold} strokeWidth="1"><rect x="3" y="9" width="22" height="14" rx="2"/><circle cx="14" cy="16" r="4.5"/><circle cx="14" cy="16" r="2"/><path d="M10 9L12 5H16L18 9"/></svg>,dinner:<svg viewBox="0 0 28 28" fill="none" stroke={C.gold} strokeWidth="1"><circle cx="14" cy="16" r="9"/><circle cx="14" cy="16" r="5.5"/><path d="M14 3V7"/></svg>,cake:<svg viewBox="0 0 28 28" fill="none" stroke={C.gold} strokeWidth="1"><rect x="5" y="12" width="18" height="13" rx="1"/><rect x="8" y="8" width="12" height="4" rx="1"/><path d="M14 3V8M10 3V8M18 3V8"/><circle cx="14" cy="2.5" r=".8" fill={C.gold}/><circle cx="10" cy="2.5" r=".8" fill={C.gold}/><circle cx="18" cy="2.5" r=".8" fill={C.gold}/></svg>,party:<svg viewBox="0 0 28 28" fill="none" stroke={C.gold} strokeWidth="1"><path d="M7 25L12 5H16L21 25"/><path d="M9 18H19M10 22H18"/><path d="M4 3L7 6M24 3L21 6M14 1V5"/></svg>};

const DetailIcons={dress:<svg viewBox="0 0 32 32" fill="none" stroke={C.gold} strokeWidth=".8" style={{width:28,height:28}}><path d="M16 4C14 4 12 6 12 8C12 10 13 11 14 12L10 28H22L18 12C19 11 20 10 20 8C20 6 18 4 16 4Z"/><path d="M12 8C10 8 9 9 9 10" opacity=".5"/><path d="M20 8C22 8 23 9 23 10" opacity=".5"/></svg>,bus:<svg viewBox="0 0 32 32" fill="none" stroke={C.gold} strokeWidth=".8" style={{width:28,height:28}}><rect x="6" y="8" width="20" height="16" rx="3"/><path d="M6 14H26"/><path d="M6 20H26"/><rect x="8" y="10" width="6" height="4" rx="1"/><rect x="18" y="10" width="6" height="4" rx="1"/><circle cx="11" cy="26" r="2"/><circle cx="21" cy="26" r="2"/></svg>,music:<svg viewBox="0 0 32 32" fill="none" stroke={C.gold} strokeWidth=".8" style={{width:28,height:28}}><path d="M12 24V8L26 5V21"/><circle cx="9" cy="24" r="3"/><circle cx="23" cy="21" r="3"/></svg>,bed:<svg viewBox="0 0 32 32" fill="none" stroke={C.gold} strokeWidth=".8" style={{width:28,height:28}}><path d="M4 24V12"/><path d="M28 24V16"/><path d="M4 16H28V24"/><rect x="6" y="12" width="6" height="4" rx="2"/><path d="M4 12H28" opacity=".4"/></svg>};

const NAV=[{label:"\u015Alub",id:"slub"},{label:"Plan dnia",id:"plan"},{label:"Historia",id:"historia"},{label:"Szczeg\u00F3\u0142y",id:"szczegoly"},{label:"Potwierdzenie",id:"potwierdzenie"},{label:"Galeria",id:"galeria"},{label:"Prezenty",id:"prezenty"}];

/* ═══ UDOSKONALENIE #13: Nav z płynnym sliding indicator ═══ */
function Nav(){
  const[vis,setVis]=useState(false);
  const[act,setAct]=useState("");
  useEffect(()=>{const h=()=>{setVis(window.scrollY>300);for(let i=NAV.length-1;i>=0;i--){const el=document.getElementById(NAV[i].id);if(el&&el.getBoundingClientRect().top<=120){setAct(NAV[i].id);break;}}};window.addEventListener("scroll",h,{passive:true});return()=>window.removeEventListener("scroll",h)},[]);
  if(!vis)return null;
  return (<nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,background:`${C.deep}F2`,backdropFilter:"blur(16px)",borderBottom:`1px solid ${C.gold}15`,animation:"slideDown .4s ease-out"}}><div className="nav-inner" style={{maxWidth:900,margin:"0 auto",display:"flex",justifyContent:"center",gap:"clamp(6px,2vw,20px)",padding:"13px 16px",flexWrap:"wrap"}}>{NAV.map(item=>(<button key={item.id} onClick={()=>{const el=document.getElementById(item.id);if(el)el.scrollIntoView({behavior:"smooth"})}} style={{fontFamily:F.body,fontSize:12,letterSpacing:2,textTransform:"uppercase",color:act===item.id?C.gold:`${C.gold}90`,background:"none",border:"none",cursor:"pointer",padding:"2px 0",borderBottom:act===item.id?`1px solid ${C.gold}`:"1px solid transparent",transition:`all .5s ${EASE_OUT_EXPO}`,transform:act===item.id?"translateY(-1px)":"none"}}>{item.label}</button>))}</div></nav>);
}

/* ═══ UDOSKONALENIE #1: Hero z golden shimmer sweep na imionach ═══ */
function Hero(){const[sy,setSy]=useState(0);useEffect(()=>{const h=()=>setSy(window.scrollY);window.addEventListener("scroll",h,{passive:true});return()=>window.removeEventListener("scroll",h)},[]);const ds=CONFIG.weddingDate.toLocaleDateString("pl-PL",{weekday:"long",day:"numeric",month:"long",year:"numeric"});const dsCapital=ds.charAt(0).toUpperCase()+ds.slice(1);
  const nameStyle={fontFamily:F.display,fontSize:"clamp(54px,13vw,96px)",fontWeight:400,fontStyle:"italic",color:C.warm,lineHeight:1.05,position:"relative"};
  return (<section style={{minHeight:"100dvh",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",position:"relative",overflow:"hidden",background:`linear-gradient(170deg,${C.deep} 0%,${C.forest} 50%,${C.deep} 100%)`}}>
    <Grain o={.035}/>
    <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse 60% 50% at 50% 45%,${C.gold}0A 0%,transparent 70%)`,transform:`translateY(${sy*.12}px)`,pointerEvents:"none",willChange:"transform"}}/>
    <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse 40% 30% at 50% 50%,${C.gold}05 0%,transparent 100%)`,pointerEvents:"none"}}/>
    <div style={{position:"absolute",inset:26,border:`0.5px solid ${C.gold}20`,pointerEvents:"none"}}/>
    <div style={{position:"absolute",top:14,left:14}}><Corner/></div><div style={{position:"absolute",top:14,right:14}}><Corner flip="scaleX(-1)"/></div><div style={{position:"absolute",bottom:14,left:14}}><Corner flip="scaleY(-1)"/></div><div style={{position:"absolute",bottom:14,right:14}}><Corner flip="scale(-1,-1)"/></div>
    <div style={{position:"relative",textAlign:"center",padding:"0 28px",maxWidth:560}}>
      <Reveal delay={.3} y={-16}><Label>Zaproszenie ślubne</Label></Reveal>
      <Reveal delay={.5}>
        <Branch w={150} o={.45}/>
        <h1 className="hero-names shimmer-text" style={{...nameStyle,margin:"12px 0 0"}}>{CONFIG.bride}</h1>
        <div style={{margin:"8px 0",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          <div style={{width:30,height:1,background:`linear-gradient(to right,transparent,${C.gold}50)`}}/>
          <span className="amp-rotate" style={{fontFamily:F.display,fontSize:"clamp(18px,4vw,26px)",fontWeight:300,fontStyle:"italic",color:C.gold,letterSpacing:4,display:"inline-block"}}>&amp;</span>
          <div style={{width:30,height:1,background:`linear-gradient(to left,transparent,${C.gold}50)`}}/>
        </div>
        <h1 className="hero-names shimmer-text" style={{...nameStyle,margin:0}}>{CONFIG.groom}</h1>
        <Branch w={150} o={.45}/>
      </Reveal>
      <Reveal delay={.9}><GoldDiv w={90} m={24} animated/><p style={{fontFamily:F.body,fontSize:"clamp(17px,4vw,22px)",color:C.warm,letterSpacing:3,opacity:.85,fontWeight:300}}>{dsCapital}</p></Reveal>
      <Reveal delay={1.15}><p style={{fontFamily:F.body,fontSize:16,fontStyle:"italic",fontWeight:300,color:C.stone,marginTop:36,lineHeight:1.9}}>&#x201E;{CONFIG.quote}&#x201D;</p></Reveal>
      {/* ═══ UDOSKONALENIE #10: Elegantszy scroll indicator ═══ */}
      <Reveal delay={1.4}><div style={{marginTop:44,animation:"float 3s ease-in-out infinite",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
        <div style={{width:24,height:38,borderRadius:12,border:`1px solid ${C.gold}40`,display:"flex",justifyContent:"center",paddingTop:8}}>
          <div style={{width:3,height:8,borderRadius:2,background:C.gold,opacity:.6,animation:"scrollDot 2s ease-in-out infinite"}}/>
        </div>
        <span style={{fontFamily:F.body,fontSize:10,letterSpacing:4,textTransform:"uppercase",color:`${C.gold}50`}}>przewiń</span>
      </div></Reveal>
    </div></section>);
}

/* ═══ UDOSKONALENIE #2: Countdown z animacją zmiany cyfr ═══ */
function CountdownDigit({value,label}){
  const [prev, setPrev] = useState(value);
  const [flip, setFlip] = useState(false);
  useEffect(()=>{
    if(value!==prev){setFlip(true);const t=setTimeout(()=>{setPrev(value);setFlip(false)},200);return()=>clearTimeout(t)}
  },[value,prev]);
  const display = String(flip ? prev : value).padStart(2,"0");
  return (<div style={{minWidth:66,textAlign:"center"}}>
    <span style={{fontFamily:F.display,fontSize:"clamp(40px,9vw,60px)",fontWeight:300,color:C.forest,display:"block",lineHeight:1,transition:`transform .3s ${SPRING}, opacity .3s`,transform:flip?"scaleY(0.8)":"scaleY(1)",opacity:flip?.4:1}}>{display}</span>
    <span style={{fontFamily:F.body,fontSize:12,letterSpacing:3,textTransform:"uppercase",color:C.stone,marginTop:8,display:"block"}}>{label}</span>
  </div>);
}

function Countdown(){const t=useCountdown(CONFIG.weddingDate);
  const pl=(n,s,p2,p5)=>n===1?s:(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20))?p2:p5;
  const u=[{v:t.d,l:pl(t.d,"dzień","dni","dni")},{v:t.h,l:pl(t.h,"godzina","godziny","godzin")},{v:t.m,l:pl(t.m,"minuta","minuty","minut")},{v:t.s,l:pl(t.s,"sekunda","sekundy","sekund")}];
  if(t.past)return (<section style={{padding:"64px 24px",background:`linear-gradient(180deg,${C.warm} 0%,${C.cream}80 50%,${C.warm} 100%)`,textAlign:"center"}}><Reveal><Label>Właśnie się pobraliśmy!</Label><Title size="clamp(24px,5vw,34px)">Dziękujemy, że jesteście z nami</Title></Reveal></section>);
  return (<section style={{padding:"64px 24px",background:`linear-gradient(180deg,${C.warm} 0%,${C.cream}80 50%,${C.warm} 100%)`,textAlign:"center",position:"relative"}}><div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:"60%",maxWidth:300,height:1,background:`linear-gradient(to right,transparent,${C.parch},transparent)`}}/><Reveal><Label>Do ślubu pozostało</Label></Reveal><div style={{display:"flex",justifyContent:"center",gap:"clamp(12px,3.5vw,32px)",flexWrap:"wrap",marginTop:20,alignItems:"flex-start"}}>{u.map((x,i)=>(<Reveal key={i} delay={.06+i*.08}><CountdownDigit value={x.v} label={x.l}/></Reveal>))}</div></section>);
}

/* ═══ UDOSKONALENIE #3: Ceremony cards z animated gradient border ═══ */
function Ceremony(){const wd=CONFIG.weddingDate;const pad2=n=>String(n).padStart(2,"0");const calStart=`${wd.getFullYear()}${pad2(wd.getMonth()+1)}${pad2(wd.getDate())}T${pad2(wd.getHours())}${pad2(wd.getMinutes())}00`;const nd=new Date(wd);nd.setDate(nd.getDate()+1);const calEnd=`${nd.getFullYear()}${pad2(nd.getMonth()+1)}${pad2(nd.getDate())}T040000`;const gCalUrl=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(CONFIG.calendarTitle)}&dates=${calStart}/${calEnd}&location=${encodeURIComponent(CONFIG.calendarLocation)}`;
  return (<section id="slub" style={{padding:"76px 24px",background:`${C.warm}`,scrollMarginTop:60,position:"relative"}}><div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse 70% 50% at 50% 30%,${C.gold}06 0%,transparent 70%)`,pointerEvents:"none"}}/><div style={{textAlign:"center",marginBottom:40,position:"relative"}}><Reveal><Label>Miejsce i czas</Label></Reveal><Reveal delay={.08}><Title>Gdzie i kiedy</Title></Reveal><Reveal delay={.12}><Branch w={120}/></Reveal></div>
    <div className="ceremony-wrap" style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:24,maxWidth:880,margin:"0 auto"}}>{[CONFIG.ceremony,CONFIG.reception].map((v,i)=>(<Reveal key={i} delay={.12+i*.12} style={{flex:"1 1 320px",maxWidth:400}}><div className="ceremony-card glow-border" style={{background:"white",border:`1px solid ${C.parch}`,padding:"40px 28px 32px",textAlign:"center",boxShadow:`0 4px 20px ${C.gold}06`,transition:`transform .5s ${SPRING}, box-shadow .5s`,position:"relative"}}><div style={{width:36,height:36,margin:"0 auto 14px"}}>{i===0?<svg viewBox="0 0 32 32" fill="none" stroke={C.gold} strokeWidth=".8"><path d="M16 2V7M13 4.5H19M8 13L16 7L24 13V28H8V13Z"/><rect x="13" y="20" width="6" height="8"/><path d="M16 13A3 3 0 1016.01 13" strokeWidth=".6"/></svg>:<svg viewBox="0 0 32 32" fill="none" stroke={C.gold} strokeWidth=".8"><rect x="4" y="10" width="24" height="18" rx="2"/><path d="M4 16H28"/><path d="M10 10V6C10 4 12 2 16 2C20 2 22 4 22 6V10" strokeWidth=".6"/><rect x="12" y="20" width="8" height="4" rx="1" opacity=".5"/></svg>}</div><Label>{v.title}</Label><h3 style={{fontFamily:F.display,fontSize:26,fontWeight:400,fontStyle:"italic",color:C.forest,margin:"10px 0 14px"}}>{v.venue}</h3><p style={{fontFamily:F.body,fontSize:16,color:C.stone,lineHeight:1.7}}>{v.address}</p><p style={{fontFamily:F.display,fontSize:24,color:C.forest,margin:"18px 0 20px",fontStyle:"italic"}}>godz. {v.time}</p><Btn href={v.mapUrl}>Jak dojechać</Btn></div></Reveal>))}</div>
    <Reveal delay={.35}><div style={{textAlign:"center",marginTop:28}}><Btn href={gCalUrl} filled>+ Dodaj do kalendarza</Btn></div></Reveal></section>);
}

/* ═══ UDOSKONALENIE #5: Timeline z pulsującymi ikonami ═══ */
function Timeline(){return (<section id="plan" style={{padding:"80px 24px",background:`linear-gradient(170deg,${C.deep},${C.forest})`,position:"relative",overflow:"hidden",scrollMarginTop:60}}><Grain o={.03}/><div style={{textAlign:"center",marginBottom:48,position:"relative"}}><Reveal><Label>Harmonogram</Label></Reveal><Reveal delay={.08}><Title color={C.warm}>Plan dnia</Title></Reveal></div>
    <div style={{maxWidth:500,margin:"0 auto",position:"relative"}}><div style={{position:"absolute",left:25,top:6,bottom:6,width:1,background:`linear-gradient(to bottom,transparent,${C.gold}28 10%,${C.gold}28 90%,transparent)`}}/>{CONFIG.timeline.map((it,i)=>(<Reveal key={i} delay={.06+i*.08} y={20}><div style={{display:"flex",gap:20,marginBottom:36}}><div className="tl-icon" style={{width:50,minWidth:50,height:50,borderRadius:"50%",border:`1px solid ${C.gold}30`,display:"flex",alignItems:"center",justifyContent:"center",background:C.deep,zIndex:1,boxShadow:`0 0 20px ${C.deep}`,transition:`box-shadow .6s ${EASE_OUT_EXPO}`}}><div style={{width:22,height:22}}>{TLIcons[it.icon]}</div></div><div style={{paddingTop:4}}><p style={{fontFamily:F.body,fontSize:13,letterSpacing:5,fontWeight:600,color:C.gold,marginBottom:4}}>{it.time}</p><p style={{fontFamily:F.display,fontSize:19,fontWeight:400,fontStyle:"italic",color:C.warm,marginBottom:4}}>{it.event}</p><p style={{fontFamily:F.body,fontSize:15,color:C.stone,fontWeight:300}}>{it.desc}</p></div></div></Reveal>))}</div></section>);
}

function OurStory(){
  const hasHeartPhoto = CONFIG.ourStoryHeartPhoto;
  const hasSidePhotos = CONFIG.ourStoryPhotos && CONFIG.ourStoryPhotos.length > 0;
  return (<section id="historia" style={{padding:"80px 24px",background:`linear-gradient(180deg,${C.cream} 0%,${C.warm} 100%)`,textAlign:"center",scrollMarginTop:60,position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse 60% 40% at 30% 20%,${C.gold}04 0%,transparent 60%)`,pointerEvents:"none"}}/>
    <div style={{position:"absolute",top:20,left:20,opacity:.05,pointerEvents:"none"}}><svg width="160" height="160" viewBox="0 0 160 160" fill="none"><path d="M10 10C30 30 50 60 80 80C50 100 30 130 10 150" stroke={C.gold} strokeWidth=".8"/><path d="M10 10C40 20 70 40 80 80C70 120 40 140 10 150" stroke={C.gold} strokeWidth=".5"/>{[30,60,90,120].map((y,i)=>(<circle key={i} cx={10+i*5} cy={y} r={2} fill="none" stroke={C.gold} strokeWidth=".3"/>))}</svg></div>
    <div style={{position:"relative"}}><Reveal><Label>O nas</Label></Reveal><Reveal delay={.08}><Title>Nasza historia</Title></Reveal><Reveal delay={.12}><Branch w={120}/></Reveal></div>
    <Reveal delay={.15}><div className="heart-ph" style={{margin:"24px auto 8px"}}>{hasHeartPhoto
      ? <div style={{width:"100%",maxWidth:280,height:0,paddingBottom:"100%",maxHeight:280,margin:"0 auto",borderRadius:"50%",overflow:"hidden",border:`2px solid ${C.gold}30`,position:"relative"}}><img src={CONFIG.ourStoryHeartPhoto} alt="" style={{position:"absolute",width:"100%",height:"100%",objectFit:"cover"}}/></div>
      : <PhotoPlaceholder shape="heart" w={280} label="miejsce na zdjęcie"/>
    }</div></Reveal>
    <div className="story-wrap" style={{display:"flex",gap:32,maxWidth:780,margin:"32px auto 0",justifyContent:"center",flexWrap:"wrap"}}>
      <div className="story-photos" style={{flex:"0 0 120px",display:"flex",flexDirection:"column",gap:12,alignItems:"center"}}>
        {hasSidePhotos ? CONFIG.ourStoryPhotos.slice(0,3).map((url,i)=>(
          <div key={i} style={{width:110,height:150,borderRadius:6,overflow:"hidden",border:`1px solid ${C.gold}20`}}><img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>
        )) : [0,1,2].map(i=>(
          <PhotoPlaceholder key={i} w={110} h={140} label="miejsce na zdjęcie"/>
        ))}
      </div>
      <div className="story-text" style={{flex:"1 1 300px",maxWidth:420}}>
        {CONFIG.ourStory.map((s,i)=>(<Reveal key={i} delay={.1+i*.1}><div style={{display:"flex",gap:20,textAlign:"left",marginBottom:32,alignItems:"flex-start"}}><div style={{minWidth:56,textAlign:"center"}}><div className="story-dot" style={{width:12,height:12,borderRadius:"50%",border:`1.5px solid ${C.gold}`,margin:"4px auto 8px",background:`${C.gold}15`,boxShadow:`0 0 8px ${C.gold}20`}}/>{i<CONFIG.ourStory.length-1&&<div style={{width:1,height:40,background:`linear-gradient(to bottom,${C.gold}35,${C.gold}10)`,margin:"0 auto"}}/>}</div><div><p style={{fontFamily:F.body,fontSize:13,letterSpacing:4,textTransform:"uppercase",color:C.gold,marginBottom:4,fontWeight:600}}>{s.date}</p><p style={{fontFamily:F.display,fontSize:20,fontWeight:400,fontStyle:"italic",color:C.forest,marginBottom:6}}>{s.title}</p><p style={{fontFamily:F.body,fontSize:16,color:C.bark,lineHeight:1.8}}>{s.text}</p></div></div></Reveal>))}
      </div>
      <div className="story-photos" style={{flex:"0 0 120px",display:"flex",flexDirection:"column",gap:12,alignItems:"center",paddingTop:40}}>
        {hasSidePhotos ? CONFIG.ourStoryPhotos.slice(3,6).map((url,i)=>(
          <div key={i} style={{width:110,height:150,borderRadius:6,overflow:"hidden",border:`1px solid ${C.gold}20`}}><img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>
        )) : [0,1,2].map(i=>(
          <PhotoPlaceholder key={i} w={110} h={140} label="miejsce na zdjęcie"/>
        ))}
      </div>
    </div>
  </section>);
}

/* ═══ UDOSKONALENIE #11: FAQ z opacity+transform, #14: Dress code swatches cascade ═══ */
function Details(){const[songModal,setSongModal]=useState(false);const[songSent,setSongSent]=useState(false);const[sName,setSName]=useState("");const[sSong,setSSong]=useState("");const[sLink,setSLink]=useState("");const[faqOpen,setFaqOpen]=useState(-1);
  /* ═══ UDOSKONALENIE #15: Modal z animacją wejścia/wyjścia ═══ */
  const[modalClosing,setModalClosing]=useState(false);
  const closeModal=()=>{setModalClosing(true);setTimeout(()=>{setSongModal(false);setModalClosing(false)},250)};
  const sendSong=()=>{if(!sName.trim()||!sSong.trim())return;setSongSent(true);setTimeout(()=>{closeModal();setSongSent(false);setSName("");setSSong("");setSLink("")},2500)};
  const mInp={fontFamily:F.body,fontSize:16,width:"100%",padding:"12px 0",border:"none",borderBottom:`1px solid ${C.gold}35`,background:"transparent",color:C.warm,outline:"none",boxSizing:"border-box",transition:`border-color .4s ${EASE_OUT_EXPO}`};
  const cardBase={background:"white",border:`1px solid ${C.parch}`,padding:"28px 24px",textAlign:"center",flex:1,display:"flex",flexDirection:"column",transition:`transform .4s ${SPRING}, box-shadow .4s`};
  return (<section id="szczegoly" style={{padding:"76px 24px",background:C.warm,scrollMarginTop:60,position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse 80% 60% at 50% 40%,${C.gold}05 0%,transparent 70%)`,pointerEvents:"none"}}/>
    <div style={{position:"absolute",top:-20,right:-20,opacity:.06,pointerEvents:"none"}}><svg width="200" height="200" viewBox="0 0 200 200" fill="none"><path d="M180 20C160 40 140 80 120 100C100 120 60 140 20 180" stroke={C.gold} strokeWidth="1"/><path d="M160 10C140 30 120 70 100 90C80 110 40 130 10 160" stroke={C.gold} strokeWidth=".6"/><path d="M140 5C125 25 110 55 95 75C80 95 50 115 20 140" stroke={C.gold} strokeWidth=".4"/>{[40,70,100,130].map((y,i)=>(<circle key={i} cx={180-y} cy={y} r={3+i} fill="none" stroke={C.gold} strokeWidth=".3"/>))}</svg></div>
    <div style={{position:"absolute",bottom:-20,left:-20,opacity:.06,pointerEvents:"none",transform:"rotate(180deg)"}}><svg width="200" height="200" viewBox="0 0 200 200" fill="none"><path d="M180 20C160 40 140 80 120 100C100 120 60 140 20 180" stroke={C.gold} strokeWidth="1"/><path d="M160 10C140 30 120 70 100 90C80 110 40 130 10 160" stroke={C.gold} strokeWidth=".6"/><path d="M140 5C125 25 110 55 95 75C80 95 50 115 20 140" stroke={C.gold} strokeWidth=".4"/></svg></div>
    <div style={{textAlign:"center",marginBottom:40,position:"relative"}}><Reveal><Label>Szczegóły</Label></Reveal><Reveal delay={.08}><Title>Wszystko co musisz wiedzieć</Title></Reveal><Reveal delay={.12}><Branch w={120}/></Reveal></div>
    <div className="detail-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:20,maxWidth:760,margin:"0 auto",alignItems:"stretch"}}>
      <Reveal delay={.1} style={{display:"flex"}}><div className="detail-card" style={{...cardBase,justifyContent:"center"}}><div style={{margin:"0 auto 10px"}}>{DetailIcons.dress}</div><Label>Dress code</Label><p style={{fontFamily:F.body,fontSize:16,color:C.bark,lineHeight:1.8,marginTop:8}}>{CONFIG.dressCode.main}</p><p style={{fontFamily:F.body,fontSize:14,color:C.stone,fontStyle:"italic",marginTop:6}}>{CONFIG.dressCode.note}</p><div style={{display:"flex",justifyContent:"center",gap:8,marginTop:16}}>{CONFIG.dressCode.colors.map((c,i)=>(<div key={i} className="swatch" style={{width:30,height:30,borderRadius:"50%",background:c,border:`2px solid ${C.warm}`,boxShadow:`0 2px 8px ${c}30`,transition:`transform .4s ${SPRING}`,cursor:"default",animationDelay:`${i*.08}s`}} onMouseEnter={e=>e.target.style.transform="scale(1.3) translateY(-4px)"} onMouseLeave={e=>e.target.style.transform="scale(1)"}/>))}</div></div></Reveal>
      <Reveal delay={.18} style={{display:"flex"}}><div className="detail-card" style={{...cardBase,justifyContent:"center"}}><div style={{margin:"0 auto 10px"}}>{DetailIcons.bus}</div><Label>Transport</Label><p style={{fontFamily:F.body,fontSize:16,color:C.bark,lineHeight:1.8,marginTop:8}}>{CONFIG.transport.departure}</p><p style={{fontFamily:F.body,fontSize:16,color:C.bark,lineHeight:1.8,marginTop:4}}>{CONFIG.transport.ret}</p></div></Reveal>
      <Reveal delay={.26} style={{display:"flex"}}><div className="detail-card" style={{...cardBase,justifyContent:"space-between"}}><div><div style={{margin:"0 auto 10px"}}>{DetailIcons.music}</div><Label>Muzyka</Label><p style={{fontFamily:F.body,fontSize:16,color:C.bark,lineHeight:1.8,marginTop:8}}>Jakiej piosenki nie może zabraknąć na parkiecie?</p></div><div style={{marginTop:16}}><Btn onClick={()=>setSongModal(true)}>Zaproponuj piosenkę</Btn></div></div></Reveal>
      <Reveal delay={.34} style={{display:"flex"}}><div className="detail-card" style={{...cardBase,justifyContent:"center"}}><div style={{margin:"0 auto 10px"}}>{DetailIcons.bed}</div><Label>Noclegi</Label>{CONFIG.hotels.map((h,i)=>(<div key={i} style={{marginTop:i?14:8,padding:i?"10px 0 0":0,borderTop:i?`1px solid ${C.parch}`:"none"}}><p style={{fontFamily:F.display,fontSize:17,fontStyle:"italic",color:C.forest}}>{h.name}</p><p style={{fontFamily:F.body,fontSize:14,color:C.stone}}>{h.distance} - {h.price}</p>{h.mapUrl&&<a href={h.mapUrl} target="_blank" rel="noopener" style={{fontFamily:F.body,fontSize:12,color:C.gold,letterSpacing:3,textTransform:"uppercase",textDecoration:"none",marginTop:6,display:"inline-flex",alignItems:"center",gap:4,fontWeight:500,transition:`opacity .3s, transform .3s ${SPRING}`}} onMouseEnter={e=>{e.target.style.opacity="0.7";e.target.style.transform="translateX(3px)"}} onMouseLeave={e=>{e.target.style.opacity="1";e.target.style.transform="none"}}>Jak dojechać <span style={{fontSize:14}}>&#x2192;</span></a>}</div>))}</div></Reveal>
    </div>
    {/* ═══ UDOSKONALENIE #11: FAQ z opacity transition ═══ */}
    <div style={{maxWidth:560,margin:"44px auto 0"}}><Reveal><div style={{textAlign:"center",marginBottom:20}}><Label>Często zadawane pytania</Label></div></Reveal>{CONFIG.faq.map((f,i)=>(<Reveal key={i} delay={.06+i*.06}><div style={{borderBottom:`1px solid ${C.parch}`}}><button onClick={()=>setFaqOpen(faqOpen===i?-1:i)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 4px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}><span style={{fontFamily:F.body,fontSize:16,color:C.forest,fontWeight:500,flex:1}}>{f.q}</span><span style={{color:C.gold,fontSize:22,transition:`transform .4s ${SPRING}`,transform:faqOpen===i?"rotate(45deg)":"none",marginLeft:12,flexShrink:0}}>+</span></button><div style={{maxHeight:faqOpen===i?500:0,opacity:faqOpen===i?1:0,overflow:"hidden",transition:`max-height .5s ${EASE_OUT_EXPO}, opacity .4s ease`}}><p style={{fontFamily:F.body,fontSize:15,color:C.bark,padding:"0 4px 16px",lineHeight:1.7}}>{f.a}</p></div></div></Reveal>))}</div>
    {/* ═══ UDOSKONALENIE #15: Modal z animacją wejścia/wyjścia ═══ */}
    {songModal&&(<div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={closeModal}><div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(6px)",opacity:modalClosing?0:1,transition:"opacity .25s ease"}}/><div onClick={e=>e.stopPropagation()} style={{position:"relative",background:`linear-gradient(170deg,${C.deep},${C.forest})`,border:`1px solid ${C.gold}20`,padding:"40px 28px 28px",maxWidth:400,width:"100%",borderRadius:14,boxShadow:"0 20px 60px rgba(0,0,0,.4)",transform:modalClosing?"scale(0.92) translateY(20px)":"scale(1) translateY(0)",opacity:modalClosing?0:1,transition:`transform .3s ${EASE_OUT_EXPO}, opacity .25s ease`,animation:modalClosing?undefined:"modalIn .35s cubic-bezier(.16,1,.3,1)"}}>
      <Grain o={.025}/>
      <button onClick={closeModal} style={{position:"absolute",top:14,right:18,background:"none",border:"none",color:C.stone,fontSize:22,cursor:"pointer",lineHeight:1,zIndex:1,transition:`transform .3s ${SPRING}`}} onMouseEnter={e=>e.target.style.transform="rotate(90deg)"} onMouseLeave={e=>e.target.style.transform="none"}>&#x2715;</button>
      <div style={{width:60,height:60,borderRadius:"50%",background:`${C.gold}18`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",position:"relative"}}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.3"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>
      {songSent?(<div style={{textAlign:"center",padding:"20px 0",position:"relative"}}><div style={{animation:"scaleIn .5s cubic-bezier(.16,1,.3,1)"}}><p style={{fontFamily:F.display,fontSize:26,fontStyle:"italic",color:C.warm,marginBottom:8}}>Dzięki!</p><p style={{fontFamily:F.body,fontSize:16,color:C.stone}}>Piosenka dodana do playlisty</p></div></div>):(<div style={{position:"relative"}}><h3 style={{fontFamily:F.display,fontSize:26,fontStyle:"italic",color:C.warm,textAlign:"center",marginBottom:24}}>Zaproponuj piosenkę</h3><div style={{marginBottom:16}}><input type="text" value={sName} onChange={e=>setSName(e.target.value)} placeholder="Twoje imię" style={mInp}/></div><div style={{marginBottom:16}}><input type="text" value={sSong} onChange={e=>setSSong(e.target.value)} placeholder="Tytuł piosenki i wykonawca" style={mInp}/></div><div style={{marginBottom:24}}><input type="text" value={sLink} onChange={e=>setSLink(e.target.value)} placeholder="Link Spotify / YouTube (opcjonalnie)" style={mInp}/></div><Btn onClick={sendSong} filled full>Zaproponuj</Btn></div>)}
    </div></div>)}</section>);
}

/* ═══ UDOSKONALENIE #9: RSVP z celebracyjną animacją sukcesu ═══ */
function RSVPSection(){const[st,setSt]=useState("idle");const[n,sN]=useState("");const[att,sA]=useState("yes");const[g,sG]=useState("1");const[diet,sD]=useState("");const[msg,sM]=useState("");const[bus,sB]=useState("no");const[meal,sMeal]=useState("tradycyjne");
  const submit=()=>{if(!n.trim())return;setSt("send");setTimeout(()=>setSt("done"),1400)};
  const iSt={fontFamily:F.body,fontSize:16,width:"100%",padding:"14px 14px",border:`1px solid ${C.parch}`,background:"white",color:C.char,outline:"none",borderRadius:0,boxSizing:"border-box",transition:`border-color .4s ${EASE_OUT_EXPO}`};
  const lSt={fontFamily:F.body,fontSize:12,letterSpacing:4,textTransform:"uppercase",color:C.gold,display:"block",marginBottom:6,fontWeight:600};
  if(st==="done")return (<section id="potwierdzenie" style={{padding:"88px 24px",background:`linear-gradient(170deg,${C.deep},${C.forest})`,textAlign:"center",scrollMarginTop:60,position:"relative"}}><Grain o={.03}/>
    {/* Celebracyjne cząsteczki */}
    <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>{Array.from({length:12}).map((_,i)=>(<div key={i} style={{position:"absolute",left:`${10+Math.random()*80}%`,top:`${20+Math.random()*60}%`,width:4+Math.random()*4,height:4+Math.random()*4,borderRadius:Math.random()>.5?"50%":"1px",background:`${C.gold}${Math.floor(20+Math.random()*30).toString(16)}`,animation:`celebFloat ${2+Math.random()*3}s ease-out ${Math.random()*.5}s both`}}/>))}</div>
    <Reveal><div style={{width:64,height:64,borderRadius:"50%",border:`1px solid ${C.gold}35`,margin:"0 auto 20px",display:"flex",alignItems:"center",justifyContent:"center",animation:`scaleIn .6s ${SPRING}`,background:`${C.gold}10`}}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.5"><path d="M5 12L10 17L19 7"/></svg></div><Title color={C.warm} size="clamp(28px,5.5vw,36px)">Dziękujemy, {n}!</Title><p style={{fontFamily:F.body,fontSize:18,color:C.stone,marginTop:8}}>{att==="yes"?"Nie możemy się doczekać spotkania z Tobą!":"Będzie nam Ciebie brakować."}</p></Reveal></section>);
  return (<section id="potwierdzenie" style={{padding:"80px 24px",background:`linear-gradient(170deg,${C.deep},${C.forest})`,scrollMarginTop:60,position:"relative"}}>
    <Grain o={.03}/>
    <div style={{textAlign:"center",marginBottom:36,position:"relative"}}><Reveal><Label>Potwierdź obecność</Label></Reveal><Reveal delay={.08}><Title color={C.warm}>Będziesz z nami?</Title></Reveal><Reveal delay={.12}><p style={{fontFamily:F.body,fontSize:16,color:C.stone}}>Prosimy o potwierdzenie do {CONFIG.rsvpDeadline}</p></Reveal></div>
    <div style={{maxWidth:440,margin:"0 auto",background:`${C.warm}F0`,backdropFilter:"blur(10px)",border:`1px solid ${C.parch}`,padding:"36px 28px",boxShadow:"0 8px 36px rgba(0,0,0,.15)",position:"relative"}}>
      <Reveal delay={.1}><div style={{marginBottom:20}}><label style={lSt}>Imię i nazwisko</label><input type="text" value={n} onChange={e=>sN(e.target.value)} placeholder="Jan Kowalski" style={iSt} onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.parch}/></div></Reveal>
      <Reveal delay={.14}><div style={{marginBottom:20}}><label style={lSt}>Czy będziesz z nami?</label><div style={{display:"flex",gap:8}}>{[{v:"yes",l:"Tak, będę!"},{v:"no",l:"Niestety nie mogę"}].map(o=>(<button key={o.v} onClick={()=>sA(o.v)} style={{...iSt,cursor:"pointer",textAlign:"center",fontSize:15,background:att===o.v?C.gold:"white",color:att===o.v?"white":C.char,fontWeight:att===o.v?600:400,borderColor:att===o.v?C.gold:C.parch,transition:`all .4s ${SPRING}`,transform:att===o.v?"scale(1.02)":"scale(1)"}}>{o.l}</button>))}</div></div></Reveal>
      {att==="yes"&&(<><Reveal delay={.06}><div style={{display:"flex",gap:10,marginBottom:20}}><div style={{flex:1}}><label style={lSt}>Osoby</label><select value={g} onChange={e=>sG(e.target.value)} style={{...iSt,appearance:"auto"}}>{[1,2,3,4,5].map(x=><option key={x} value={x}>{x}</option>)}</select></div><div style={{flex:1}}><label style={lSt}>Autobus</label><select value={bus} onChange={e=>sB(e.target.value)} style={{...iSt,appearance:"auto"}}><option value="no">Nie potrzebuję</option><option value="yes">Tak, poproszę</option></select></div></div></Reveal>
        <Reveal delay={.1}><div style={{marginBottom:20}}><label style={lSt}>Menu</label><select value={meal} onChange={e=>sMeal(e.target.value)} style={{...iSt,appearance:"auto"}}><option>tradycyjne</option><option>wegetariańskie</option><option>wegańskie</option><option>bezglutenowe</option></select></div></Reveal>
        <Reveal delay={.14}><div style={{marginBottom:20}}><label style={lSt}>Alergie / uwagi</label><input type="text" value={diet} onChange={e=>sD(e.target.value)} placeholder="Opcjonalnie..." style={iSt} onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.parch}/></div></Reveal></>)}
      <Reveal delay={.18}><div style={{marginBottom:24}}><label style={lSt}>Życzenia dla Pary</label><textarea value={msg} onChange={e=>sM(e.target.value)} rows={2} placeholder="Kilka ciepłych słów... (opcjonalnie)" style={{...iSt,resize:"vertical"}} onFocus={e=>e.target.style.borderColor=C.gold} onBlur={e=>e.target.style.borderColor=C.parch}/></div></Reveal>
      <Reveal delay={.22}><button onClick={submit} disabled={!n.trim()||st==="send"} className="rsvp-submit" style={{width:"100%",fontFamily:F.body,fontSize:14,letterSpacing:5,textTransform:"uppercase",fontWeight:600,padding:"16px",background:st==="send"?C.stone:C.gold,color:"white",border:"none",cursor:n.trim()?"pointer":"not-allowed",opacity:n.trim()?1:.4,transition:`all .4s ${SPRING}`,position:"relative",overflow:"hidden"}}>{st==="send"?<span style={{display:"inline-flex",alignItems:"center",gap:8}}>Wysyłanie<span className="dots-loading">...</span></span>:"Potwierdź obecność"}</button></Reveal>
    </div></section>);
}

function Gallery(){
  return (<section id="galeria" style={{padding:"80px 24px",background:`linear-gradient(180deg,${C.warm} 0%,${C.cream} 40%,${C.warm} 100%)`,scrollMarginTop:60,textAlign:"center",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse 50% 50% at 70% 60%,${C.gold}04 0%,transparent 60%)`,pointerEvents:"none"}}/>
    <div style={{position:"absolute",bottom:10,right:10,opacity:.04,pointerEvents:"none"}}><svg width="180" height="180" viewBox="0 0 180 180" fill="none"><path d="M170 170C150 150 130 120 100 100C130 80 150 50 170 10" stroke={C.gold} strokeWidth=".8"/><path d="M170 170C140 160 110 140 100 100C110 60 140 40 170 10" stroke={C.gold} strokeWidth=".5"/></svg></div>
    <div style={{position:"relative"}}><Reveal><Label>Wspomnienia</Label></Reveal></div>
    <Reveal delay={.08}><Title>Wasze zdjęcia i nasze wspomnienia</Title></Reveal>
    <Reveal delay={.12}><Branch w={120}/></Reveal>
    <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:24,maxWidth:880,margin:"32px auto 0"}}>
      <Reveal delay={.16} style={{flex:"1 1 340px",maxWidth:420}}>
        <div className="detail-card" style={{background:"white",border:`1px solid ${C.parch}`,padding:"36px 28px",textAlign:"center",transition:`transform .4s ${SPRING}, box-shadow .4s`}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:`${C.gold}12`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={C.gold} strokeWidth=".9"><rect x="3" y="7" width="26" height="18" rx="3"/><circle cx="16" cy="16" r="5"/><circle cx="16" cy="16" r="2.5"/><path d="M11 7L13 3H19L21 7"/><circle cx="24" cy="10" r="1" fill={C.gold}/></svg>
          </div>
          <Label>Wasze zdjęcia</Label>
          <p style={{fontFamily:F.body,fontSize:16,color:C.bark,lineHeight:1.8,marginTop:8}}>Zróbcie zdjęcia z naszego wesela i podzielcie się nimi! Każde ujęcie jest dla nas bezcenne.</p>
          <p style={{fontFamily:F.body,fontSize:14,color:C.stone,fontStyle:"italic",marginTop:8,marginBottom:20}}>Kliknij poniżej i dodaj swoje zdjęcia do wspólnego albumu</p>
          <Btn href={CONFIG.guestPhotosUrl} filled>Dodaj swoje zdjęcia</Btn>
        </div>
      </Reveal>
      <Reveal delay={.24} style={{flex:"1 1 340px",maxWidth:420}}>
        <div className="detail-card" style={{background:"white",border:`1px solid ${C.parch}`,padding:"36px 28px",textAlign:"center",transition:`transform .4s ${SPRING}, box-shadow .4s`}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:`${C.gold}12`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={C.gold} strokeWidth=".9"><rect x="2" y="6" width="14" height="20" rx="2"/><rect x="18" y="4" width="12" height="16" rx="2"/><rect x="18" y="22" width="12" height="6" rx="1"/><path d="M6 10H12M6 14H10" opacity=".4"/></svg>
          </div>
          <Label>Galeria fotografa</Label>
          <p style={{fontFamily:F.body,fontSize:16,color:C.bark,lineHeight:1.8,marginTop:8}}>Profesjonalne zdjęcia i film z naszego ślubu. Album będzie dostępny kilka tygodni po weselu.</p>
          <p style={{fontFamily:F.body,fontSize:14,color:C.stone,fontStyle:"italic",marginTop:8,marginBottom:20}}>Pełna galeria w wysokiej rozdzielczości do pobrania</p>
          <Btn href={CONFIG.photographerGalleryUrl} filled>Zobacz galerię</Btn>
        </div>
      </Reveal>
    </div>
  </section>);
}

function Gifts(){const[open,setOpen]=useState(false);const[closing,setClosing]=useState(false);const[ci,sC]=useState(-1);const copy=(iban,i)=>{const text=iban.replace(/\s/g,"");if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(()=>{sC(i);setTimeout(()=>sC(-1),2200)}).catch(()=>fallbackCopy(text,i))}else{fallbackCopy(text,i)}};const fallbackCopy=(text,i)=>{const ta=document.createElement("textarea");ta.value=text;ta.style.cssText="position:fixed;left:-9999px;top:-9999px";document.body.appendChild(ta);ta.focus();ta.select();try{document.execCommand("copy");sC(i);setTimeout(()=>sC(-1),2200)}catch(e){}document.body.removeChild(ta)};
  const closeGifts=()=>{setClosing(true);setTimeout(()=>{setOpen(false);setClosing(false)},250)};
  return (<section id="prezenty" style={{padding:"80px 24px",background:`linear-gradient(170deg,${C.deep},${C.forest})`,textAlign:"center",scrollMarginTop:60,position:"relative"}}>
    <Grain o={.03}/>
    <Reveal><Label>Prezenty</Label></Reveal>
    <Reveal delay={.08}><Title color={C.warm} size="clamp(32px,7vw,46px)">Z miłości, nie z obowiązku</Title></Reveal>
    <Reveal delay={.14}><p style={{fontFamily:F.body,fontSize:18,fontStyle:"italic",color:C.stone,maxWidth:480,margin:"8px auto 28px",lineHeight:1.8,position:"relative"}}>{CONFIG.gifts}</p></Reveal>
    <Reveal delay={.2}>
      <div style={{margin:"0 auto 28px",position:"relative"}}><svg width="48" height="48" viewBox="0 0 40 40" fill="none" stroke={C.gold} strokeWidth="1"><rect x="5" y="16" width="30" height="20" rx="2"/><path d="M5 22H35"/><path d="M20 16V36"/><path d="M20 16C20 16 14 10 11 10C8 10 7 12 8 14C9 16 20 16 20 16"/><path d="M20 16C20 16 26 10 29 10C32 10 33 12 32 14C31 16 20 16 20 16"/></svg></div>
      <Btn onClick={()=>setOpen(true)} filled>Zobacz więcej</Btn>
    </Reveal>
    {open&&(<div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={closeGifts}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(6px)",opacity:closing?0:1,transition:"opacity .25s ease"}}/>
      <div onClick={e=>e.stopPropagation()} style={{position:"relative",background:`linear-gradient(170deg,${C.deep},${C.forest})`,border:`1px solid ${C.gold}20`,padding:"40px 28px 32px",maxWidth:440,width:"100%",borderRadius:14,boxShadow:"0 20px 60px rgba(0,0,0,.4)",transform:closing?"scale(0.92) translateY(20px)":"scale(1) translateY(0)",opacity:closing?0:1,transition:`transform .3s ${EASE_OUT_EXPO}, opacity .25s ease`,animation:closing?undefined:`modalIn .35s ${EASE_OUT_EXPO}`}}>
        <Grain o={.025}/>
        <button onClick={closeGifts} style={{position:"absolute",top:14,right:18,background:"none",border:"none",color:C.stone,fontSize:22,cursor:"pointer",lineHeight:1,zIndex:1,transition:`transform .3s ${SPRING}`}} onMouseEnter={e=>e.target.style.transform="rotate(90deg)"} onMouseLeave={e=>e.target.style.transform="none"}>&#x2715;</button>
        <div style={{width:56,height:56,borderRadius:"50%",background:`${C.gold}18`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",position:"relative"}}><svg width="24" height="24" viewBox="0 0 40 40" fill="none" stroke={C.gold} strokeWidth="1.3"><rect x="5" y="16" width="30" height="20" rx="2"/><path d="M5 22H35"/><path d="M20 16V36"/><path d="M20 16C20 16 14 10 11 10C8 10 7 12 8 14C9 16 20 16 20 16"/><path d="M20 16C20 16 26 10 29 10C32 10 33 12 32 14C31 16 20 16 20 16"/></svg></div>
        <h3 style={{fontFamily:F.display,fontSize:26,fontStyle:"italic",color:C.warm,marginBottom:12,position:"relative"}}>Prezenty</h3>
        <p style={{fontFamily:F.body,fontSize:16,color:C.stone,lineHeight:1.8,marginBottom:24,position:"relative"}}>Twoja obecność jest więcej niż wystarczająca, ale jeśli chcesz pomóc nam wspólnie zbudować ten nowy rozdział, oto numery kont:</p>
        {CONFIG.accounts.map((a,i)=>(<div key={i} style={{marginBottom:i<CONFIG.accounts.length-1?20:0,padding:i?"20px 0 0":0,borderTop:i?`1px solid ${C.gold}18`:"none",position:"relative"}}>
          <p style={{fontFamily:F.body,fontSize:14,color:C.gold,letterSpacing:2,textTransform:"uppercase",marginBottom:6,fontWeight:600}}>{a.holder}</p>
          <p style={{fontFamily:F.mono,fontSize:16,color:C.warm,letterSpacing:1,marginBottom:10,wordBreak:"break-all"}}>{a.iban}</p>
          <button onClick={()=>copy(a.iban,i)} style={{fontFamily:F.body,fontSize:12,letterSpacing:3,textTransform:"uppercase",padding:"9px 22px",background:ci===i?`${C.gold}25`:"transparent",color:ci===i?C.gold:C.warm,border:`1px solid ${ci===i?C.gold:`${C.warm}30`}`,cursor:"pointer",transition:`all .4s ${SPRING}`,fontWeight:500,borderRadius:4,transform:ci===i?"scale(1.05)":"scale(1)"}}>{ci===i?"\u2713 Skopiowano":"Kopiuj numer"}</button>
        </div>))}
      </div>
    </div>)}
  </section>);
}

function Footer(){const ds=CONFIG.weddingDate.toLocaleDateString("pl-PL",{weekday:"long",day:"numeric",month:"long",year:"numeric"});const dsC=ds.charAt(0).toUpperCase()+ds.slice(1);
  return (<footer style={{padding:"56px 24px 36px",background:`linear-gradient(170deg,${C.deep},${C.forest})`,textAlign:"center",position:"relative"}}><Grain o={.02}/><Reveal><Branch w={100} o={.25}/><h3 style={{fontFamily:F.display,fontSize:"clamp(30px,7vw,42px)",fontWeight:400,fontStyle:"italic",color:C.warm,margin:"14px 0 4px"}}>{CONFIG.bride} & {CONFIG.groom}</h3><p style={{fontFamily:F.body,fontSize:16,color:C.gold,letterSpacing:4,fontWeight:300}}>{dsC}</p><GoldDiv w={70} m={24} animated/><div style={{margin:"0 auto 20px"}}><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill={`${C.gold}30`} stroke={C.gold} strokeWidth=".6"/></svg></div><div style={{marginTop:24,padding:"16px 0",borderTop:`1px solid ${C.gold}12`}}><p style={{fontFamily:F.body,fontSize:13,color:`${C.stone}70`,letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>Zaproszenie przygotowane przez</p><a href={CONFIG.venueUrl} target="_blank" rel="noopener" style={{fontFamily:F.display,fontSize:20,fontStyle:"italic",color:C.gold,textDecoration:"none",borderBottom:`1px solid ${C.gold}40`,paddingBottom:2,transition:`opacity .3s, transform .3s ${SPRING}`}} onMouseEnter={e=>{e.target.style.opacity="0.7"}} onMouseLeave={e=>{e.target.style.opacity="1"}}>{CONFIG.venueBrand}</a></div></Reveal></footer>);
}

function AudioPlayer(){
  const audioRef=useRef(null);
  const[playing,setPlaying]=useState(false);
  const[expanded,setExpanded]=useState(false);
  if(!CONFIG.bgMusicUrl)return null;
  const toggle=()=>{
    const a=audioRef.current;if(!a)return;
    if(playing){a.pause();setPlaying(false)}
    else{a.volume=0.3;a.play().then(()=>setPlaying(true)).catch(()=>{})}
  };
  return (<div style={{position:"fixed",bottom:20,right:20,zIndex:150,display:"flex",alignItems:"center",gap:10,flexDirection:"row-reverse"}}>
    <audio ref={audioRef} src={CONFIG.bgMusicUrl} loop preload="auto"/>
    <button onClick={toggle} onMouseEnter={()=>setExpanded(true)} onMouseLeave={()=>setExpanded(false)} style={{width:48,height:48,borderRadius:"50%",border:`1px solid ${C.gold}40`,background:`${C.deep}E8`,backdropFilter:"blur(12px)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 20px rgba(0,0,0,.3)`,transition:`all .4s ${SPRING}`,transform:expanded?"scale(1.1)":"scale(1)"}}>
      {playing
        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.5"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.5"><polygon points="6,3 20,12 6,21" fill={`${C.gold}30`}/></svg>
      }
    </button>
    {expanded&&CONFIG.bgMusicTitle&&(<div style={{background:`${C.deep}E8`,backdropFilter:"blur(12px)",border:`1px solid ${C.gold}20`,borderRadius:8,padding:"8px 14px",whiteSpace:"nowrap",boxShadow:`0 4px 16px rgba(0,0,0,.25)`,animation:`modalIn .25s ${EASE_OUT_EXPO}`}}>
      <p style={{fontFamily:F.body,fontSize:11,color:C.gold,letterSpacing:2,textTransform:"uppercase",margin:0}}>{CONFIG.bgMusicTitle}</p>
    </div>)}
  </div>);
}

export default function App(){
  const Filigree=()=>(<div style={{padding:"12px 0",textAlign:"center",position:"relative",overflow:"hidden"}}>
    <svg viewBox="0 0 600 40" fill="none" style={{width:"min(90%,500px)",height:40,display:"block",margin:"0 auto",opacity:.35}}>
      <path d="M0 20H180" stroke={C.gold} strokeWidth=".4"/>
      <path d="M420 20H600" stroke={C.gold} strokeWidth=".4"/>
      <g transform="translate(300,20)">
        <circle r="3" stroke={C.gold} strokeWidth=".5" fill="none"/>
        <circle r="8" stroke={C.gold} strokeWidth=".3" fill="none" opacity=".5"/>
        <path d="M-12 0C-12-6-8-10 0-10C8-10 12-6 12 0" stroke={C.gold} strokeWidth=".4" fill="none"/>
        <path d="M-12 0C-12 6-8 10 0 10C8 10 12 6 12 0" stroke={C.gold} strokeWidth=".4" fill="none"/>
        <path d="M-30 0C-22-8-14-10-8-6" stroke={C.gold} strokeWidth=".3" fill="none"/>
        <path d="M30 0C22-8 14-10 8-6" stroke={C.gold} strokeWidth=".3" fill="none"/>
        <path d="M-30 0C-22 8-14 10-8 6" stroke={C.gold} strokeWidth=".3" fill="none"/>
        <path d="M30 0C22 8 14 10 8 6" stroke={C.gold} strokeWidth=".3" fill="none"/>
        <circle cx="-30" cy="0" r="1.5" fill={`${C.gold}20`}/>
        <circle cx="30" cy="0" r="1.5" fill={`${C.gold}20`}/>
        <path d="M-50-2C-42-6-36-4-30 0C-36 4-42 6-50 2" stroke={C.gold} strokeWidth=".25" fill="none" opacity=".6"/>
        <path d="M50-2C42-6 36-4 30 0C36 4 42 6 50 2" stroke={C.gold} strokeWidth=".25" fill="none" opacity=".6"/>
        <circle cx="-50" cy="0" r="1" fill={`${C.gold}15`}/>
        <circle cx="50" cy="0" r="1" fill={`${C.gold}15`}/>
      </g>
      <path d="M180 20C200 20 220 12 240 14C260 16 280 10 300 12" stroke={C.gold} strokeWidth=".3" opacity=".4"/>
      <path d="M300 12C320 14 340 8 360 10C380 12 400 20 420 20" stroke={C.gold} strokeWidth=".3" opacity=".4"/>
    </svg>
    <div style={{position:"absolute",top:"50%",left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${C.gold}10,transparent)`,transform:"translateY(-50%)",zIndex:0}}/>
  </div>);
  return (<div style={{margin:0,padding:0,background:C.warm,minHeight:"100dvh",overflowX:"hidden",animation:"pageIn 1.2s ease-out"}}>
  {/* ═══ UDOSKONALENIE #6: prefers-reduced-motion + #7: focus-visible + #12: shimmer aktywny + nowe animacje ═══ */}
  <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Mono:wght@400&display=swap');*{margin:0;padding:0;box-sizing:border-box}html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}::selection{background:${C.gold}30;color:${C.forest}}input::placeholder,textarea::placeholder{color:${C.stone};font-style:italic;font-weight:300}@keyframes pageIn{from{opacity:0}to{opacity:1}}@keyframes float{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(8px);opacity:.9}}@keyframes scaleIn{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}@keyframes slideDown{from{transform:translateY(-100%)}to{transform:translateY(0)}}@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}@keyframes spinDiamond{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}@keyframes modalIn{from{opacity:0;transform:scale(0.92) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}@keyframes scrollDot{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(6px)}}@keyframes celebFloat{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-80px) scale(0)}}@keyframes heroShimmer{0%{background-position:-200% center}100%{background-position:200% center}}@keyframes tlPulse{0%,100%{box-shadow:0 0 20px ${C.deep}}50%{box-shadow:0 0 20px ${C.deep}, 0 0 8px ${C.gold}20}}.ceremony-card:hover{transform:translateY(-4px)!important;box-shadow:0 12px 40px ${C.gold}10!important}.detail-card:hover{transform:translateY(-3px);box-shadow:0 8px 28px ${C.gold}08}.glow-border:hover::after{opacity:1}.shimmer-text{background:linear-gradient(105deg,${C.warm} 0%,${C.warm} 35%,${C.goldL} 50%,${C.warm} 65%,${C.warm} 100%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:heroShimmer 6s ease-in-out infinite}.amp-rotate{transition:transform 2s cubic-bezier(.16,1,.3,1)}.amp-rotate:hover{transform:rotate(15deg) scale(1.1)}.tl-icon{animation:tlPulse 3s ease-in-out infinite}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${C.warm}}::-webkit-scrollbar-thumb{background:${C.gold}50;border-radius:3px}img{max-width:100%;height:auto}button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid ${C.gold};outline-offset:2px}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important;scroll-behavior:auto!important}.shimmer-text{animation:none!important;-webkit-text-fill-color:${C.warm}!important}}@media(max-width:768px){.story-photos{display:none!important}.story-wrap{gap:0!important;max-width:100%!important}.story-text{max-width:100%!important;flex:1 1 100%!important}}@media(max-width:480px){section{padding-left:16px!important;padding-right:16px!important}.detail-grid{grid-template-columns:1fr!important;max-width:400px!important}.ceremony-wrap{gap:16px!important}.nav-inner{overflow-x:auto;-webkit-overflow-scrolling:touch;flex-wrap:nowrap!important;justify-content:flex-start!important;gap:14px!important;padding:11px 16px!important}.nav-inner::-webkit-scrollbar{display:none}.heart-ph{width:200px!important;height:200px!important}}@media(max-width:360px){section{padding-left:12px!important;padding-right:12px!important}.hero-names{font-size:clamp(38px,12vw,60px)!important}}`}</style>
  <Nav/><AudioPlayer/><Hero/><Countdown/><Filigree/><Ceremony/><Timeline/><OurStory/><Filigree/><Details/><RSVPSection/><Gallery/><Filigree/><Gifts/><Footer/>
</div>)}
