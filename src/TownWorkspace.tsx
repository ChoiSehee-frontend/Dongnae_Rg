import {useEffect,useMemo,useRef,useState,type ReactNode} from 'react'
import {MapContainer,GeoJSON,TileLayer,Marker,Tooltip,useMap} from 'react-leaflet'
import L from 'leaflet'
import {TownData} from './TownData'
import {PlanStep,ChangeStep,VoiceStep} from './TownJourney'
import parks from './data/parks.json'
import type {Feature,MultiPolygon} from 'geojson'
import metrics from './data/town-metrics.json'
import {Facts,gokgangFacts} from './Facts'
import stories from './data/stories.json'
import projects from './data/projects.json'
import events from './data/events.json'
import traffic from './data/traffic.json'

const groups=['행사·모집','생활시설','동네의 미래','공사·통행','공원'] as const
const symbols=['●','■','▲','◆','✿']
// 공원은 폰트 글리프 대신 SVG 마커를 사용해 흰색 배경/글자 충돌을 회피합니다.
function markerHtml(group:number, chosen:boolean):string {
 if(group===4) return `<span class="park-pin${chosen?' chosen':''}" style="display:grid;place-items:center;width:28px;height:28px;box-sizing:border-box;border:2px solid #32765a;border-radius:50%;background:${chosen?'#bde7cb':'#e3f4e8'};box-shadow:0 2px 5px #203d3544"><svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="6.6" r="4.2" fill="#3e966d"/><circle cx="17.4" cy="12" r="4.2" fill="#3e966d"/><circle cx="12" cy="17.4" r="4.2" fill="#3e966d"/><circle cx="6.6" cy="12" r="4.2" fill="#3e966d"/><circle cx="12" cy="12" r="3.2" fill="#e3f4e8"/></svg></span>`
 return `<span class="tone${group}${chosen?' chosen':''}">${symbols[group]}</span>`
}
type Item={id:string; group:number; title:string; note:string; pos?:[number,number]; rows:[string,string][]; sources:[string,string][]}
const librarySource='https://pohang.go.kr/news/bbs/view.do?bbsType=235&idx=800396&mid=0101000000'
const life:Item[]=[
 {id:'heunghae-recovery',group:2,title:'흥해 지진피해지역 특별재생사업',note:'흥해읍 소재지 · 지진 피해 복구와 생활시설 확충',rows:[
 ['대상','북구 흥해읍 소재지 일원 · 약 120만㎡'],['계획기간','2019~2023년 · 시청 사업개요 기준'],['계획 사업비','2,257억원'],['재원','국비 767억 · 도비 104억 · 시비 1,286억 · 민간 100억'],['마을회관','9곳 · 내진보강·리모델링 계획'],['문화·체육','남성리 대웅파크 2차 부지 · 수영장·체육관·생활문화센터 계획'],['공공도서관','포은흥해도서관 · 2025년 3월 개관 확인'],['전체 준공','미확인 · 개별 시설 개관과 구분']
 ],sources:[['포항시 · 특별재생사업 개요','https://www.pohang.go.kr/dept/contents.do?mid=0302020500'],['포항시 · 도서관 개관',librarySource]]},
 {id:'market',group:0,title:'흥해시장 오일장',note:'정기 장날 · 매월 2일·7일부터 닷새 간격',pos:[36.110619,129.348288],rows:[['장소','흥해시장 · 한동로 61-13'],['장날','매월 2·7·12·17·22·27일'],['당일 운영','임시 휴장과 운영시간은 미확인']],sources:[['한국관광공사 · 정기 장날','https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=fd110ff7-239f-4239-b709-3562fa9de93c'],['시장 위치 자료','https://ger.clubrichtour.co.kr/bbs/board.php?bo_table=public_trdit_mrkt&wr_id=1146']]},
 {id:'lib',group:1,title:'포은흥해도서관',note:'음악 특성화 도서관 · 흥해로81번길',pos:[36.1118304,129.3428173],rows:[['위치','흥해읍 흥해로81번길 46'],['시설','음악 특성화 공공도서관'],['개관','2025년 3월'],['공간 변화','지진 피해 공동주택 부지 → 도서관·아이누리플라자'],['지난 프로그램','낙엽 위의 인문학 · 2026.10.07 종료']],sources:[['포항시 · 개관 안내',librarySource],['주소 대표점','https://findby.co.kr/details/37537-471134712844-st-67aa2d8b62c51c5729964455'],['지난 프로그램','https://jp.pohang.go.kr/phtrauma/main/lectureInfo/index.do?menu_idx=38']]}
]
type Notice={id:string;townId:string;title:string;segment:string;position:[number,number];startsAt:string;endsAt:string;impact:string;source:string}
function activeTraffic(townId:string):Item[]{
 const now=Date.now()
 return (traffic.notices as Notice[]).filter(n=>n.townId===townId && Date.parse(n.startsAt)<=now && now<=Date.parse(n.endsAt) && n.position?.length===2 && n.position.every(Number.isFinite)).map(n=>({id:'traffic:'+n.id,group:3,title:n.title,note:n.segment,pos:n.position,rows:[['구간',n.segment],['시작',n.startsAt],['종료',n.endsAt],['영향',n.impact]],sources:[['통제 공지',n.source]]}))
}
function Navigate({item,bounds}:{item?:Item;bounds:L.LatLngBounds}){
 const map=useMap()
 useEffect(()=>{if(item?.pos)map.setView(item.pos,15,{animate:false});else map.fitBounds(bounds,{padding:[18,18],animate:false})},[item,bounds,map])
 return null
}
function PopulationComparison({code}:{code:string}){
 const info=(metrics as (typeof metrics)[number][]).find(m=>m.adm_cd===code)
 if(!info)return <p className="town-data-empty">연도별 비교 자료를 확인하지 못했습니다.</p>
 const values=[info.population_2023,info.population_2024]
 const maximum=Math.max(...values,1)
 return <section className="town-comparison" aria-label="2023년과 2024년 인구 비교">
  <div className="town-section-heading"><div><small>SGIS · 2개 연도 비교</small><h3>과거 → 현재</h3></div><span>인구</span></div>
  {values.map((value,index)=><div className="town-comparison-row" key={index}>
   <span>{2023+index}</span><div><i style={{width:`${value/maximum*100}%`}}/></div><strong>{value.toLocaleString('ko-KR')}명</strong>
  </div>)}
  <small className="town-comparison-note">두 시점 비교이며 장기 추세나 특정 사업의 영향은 나타내지 않습니다.</small>
 </section>
}
export function TownWorkspace({town,boundary,plans,attribution}:{town:{id:string;name:string;gu:string};boundary:Feature<MultiPolygon>;plans:Record<string,string>;attribution:ReactNode}){
 const censusCode=String(boundary.properties?.adm_cd ?? '')
 const localParks=useMemo(()=>parks.filter(p=>p.adm_cd===censusCode),[censusCode])
 const [showParkPins,setShowParkPins]=useState(true)
 const items=useMemo(()=>[...(town.name==='흥해읍'?life:[]),...activeTraffic(town.id),...localParks.map((p):Item=>({id:'park:'+p.id,group:4,title:p.name,note:p.kind+' · '+p.address,pos:[p.lat,p.lng],rows:[['공원 종류',p.kind],['공원 면적',p.area_m2.toLocaleString('ko-KR')+'㎡'],['주소',p.address],['데이터 기준일',p.date],['자료 범위','공원 CSV에 수록된 시설이며 전체 공원 통계와 다를 수 있음']],sources:[['전국도시공원정보표준데이터','https://www.data.go.kr/data/15012890/standard.do']]})),...projects.projects.filter(p=>plans[p.id]===town.name).map((p):Item=>{
 const story=stories[p.id as keyof typeof stories]
 return {id:p.id,title:p.name,group:2,pos:p.position as [number,number] | undefined,note:story.place,rows:p.id==='gokgang'?[...gokgangFacts,['지도 표시','고시 지번의 대표점 · 사업구역 경계 및 출입구 아님'],['기한의 의미','사업 종료 예정일 · 입주일 또는 도로 개통일 아님'],['기본계획상 역할','흥해 주거지 개발 · 원도심과 흥해 시가지 연결'],['기본계획 당시','265,600㎡ · 2014.12~2017.12 · 당시 진행 중'],['예상 유발인구','6,038명 · 계획 수립 당시 추정'],['예상 외부 유입','2,234명 · 외부 유입률 37% · 실제 전입 통계 아님']]:[['위치',story.place],...story.sections.map(([q,a])=>[q,a] as [string,string]),['현장 확인',story.field]],sources:[...events.filter(e=>e.projectId===p.id).map((e):[string,string]=>[e.source+' · '+e.title,e.url]),...(p.id==='gokgang'?[['2030 포항 도시기본계획 · 표 3-12(71쪽), 표 7-18(267쪽)','https://eum.go.kr/web/in/pd/pdBoardDet.jsp?bd_type=3&gbn=I&seq=110'] as [string,string],['지번 대표점 · 카카오맵','https://map.kakao.com/link/search/포항시 북구 흥해읍 곡강리 산148-2'] as [string,string]]:[])]}
 })],[plans,town.name,town.id,localParks])
 const [selected,setSelected]=useState<string|null>(null)
 const item=items.find(i=>i.id===selected)
 const panel=useRef<HTMLDivElement>(null)
 const bounds=useMemo(()=>L.geoJSON(boundary).getBounds(),[boundary])
 const projectIds=useMemo(()=>projects.projects.filter(p=>plans[p.id]===town.name).map(p=>p.id),[plans,town.name])
 function scrollToPanel(){if(panel.current){panel.current.focus({preventScroll:true});if(window.innerWidth<=760)panel.current.scrollIntoView({block:'nearest',behavior:'smooth'})}}
 function select(id:string){setSelected(id);scrollToPanel()}
 function selectProject(id:string){select(id)}
 return <main className="local-board">
   <header className="town-header">
    <a className="town-back" href="#pohang">← 포항 지도</a>
    <div><small>경상북도 · 포항시 · {town.gu}</small><h1>{town.name}</h1></div>
    <span className="journey-version">동네알기 · 동네 기록</span>
   </header>
   <nav className="town-toolbar" aria-label="동네 정보 바로가기">
    <a className="town-toolbar-region" href="#pohang">지역 선택 <span>{town.name}⌄</span></a>
    <a href="#town-map">보행 · 교통</a>
    <a href="#town-parks">공원 · 녹지</a>
    <div className="town-toolbar-meta"><span>계획 버전 · 2030 포항 도시기본계획</span><span>자료 기준일 · 통계별 상이</span><span>최근 확인일 · 자료별 표시</span></div>
   </nav>
   <div className="town-dashboard" ref={panel} tabIndex={-1}>
     <section className="town-card town-current" id="town-map" aria-labelledby="town-current-title">
      <header className="town-card-heading"><h2 id="town-current-title"><span>1</span> 우리 동네의 현재</h2><a href="#town-parks">장소와 공원 목록 ↓</a></header>
      <div className="town-current-grid">
       <div className="town-current-map">
       <MapContainer bounds={bounds} boundsOptions={{padding:[18,18]}} className="local-map" scrollWheelZoom>
         <TileLayer attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
         <GeoJSON data={boundary} interactive={false} style={{color:'#297264',weight:2,fillOpacity:.06}}/>
         <Navigate item={item} bounds={bounds}/>
         {items.filter(i=>i.pos && (i.group!==4 || showParkPins)).map(i=><Marker key={i.id} position={i.pos!} title={i.title} alt={i.title} zIndexOffset={selected===i.id?200:0} icon={L.divIcon({className:'local-marker',html:markerHtml(i.group,i.id===selected),iconSize:[28,28],iconAnchor:i.group>=2?[14,14]:i.id==='market'?[0,14]:[28,14]})} eventHandlers={{click:()=>select(i.id)}}><Tooltip>{i.title}</Tooltip></Marker>)}
       </MapContainer>
       <div className="local-key" id="town-parks">
         {groups.map((g,i)=><span key={g}><b className={'tone'+i}>{symbols[i]}</b> {g}</span>)}
         <button type="button" onClick={()=>setShowParkPins(v=>!v)} aria-pressed={showParkPins}>{showParkPins?'공원 마커 숨기기':'공원 마커 표시'}</button>
       </div>
       <small>{attribution}</small>
       </div>
       <div className="town-current-data">
        <TownData code={censusCode}/>
        <PopulationComparison code={censusCode}/>
       </div>
      </div>
      <div className="town-place-index">
       <div className="town-section-heading"><div><small>지도에서 확인할 수 있는 정보</small><h3>장소 둘러보기</h3></div><span>{items.length}개 항목</span></div>
       <div className="town-place-groups">
        {groups.map((g,i)=>{
         const filtered=items.filter(x=>x.group===i)
         return <details className="journey-place-group" key={g}>
          <summary><b className={'tone'+i}>{symbols[i]}</b> {g} <span>{filtered.length}개</span></summary>
          {filtered.length?filtered.map(x=><button type="button" className="local-row" key={x.id} onClick={()=>select(x.id)}><strong>{x.title}</strong><span>{x.note}</span><i>›</i></button>):<p className="journey-empty">{i===3?'확인된 통제 공지 없음 · 실제 통행 상태 미확인':i===4?'공원 CSV 수록 항목 없음 · 실제 공원이 없다는 뜻은 아님':'연결해 검증한 장소 자료 없음'}</p>}
         </details>
        })}
       </div>
      </div>
      {item&&<section className="town-card town-place-detail" aria-live="polite">
       <div className="town-card-heading"><h2><span>장소</span> {item.title}</h2><button type="button" onClick={()=>setSelected(null)}>선택 해제 ×</button></div>
       <small>{groups[item.group]} · {item.pos?'지도에서 확인':'위치 좌표 미확인'}</small><p>{item.note}</p>
       <Facts rows={item.rows}/>
       {events.some(e=>e.projectId===item.id)&&<details><summary>고시 기록</summary>{events.filter(e=>e.projectId===item.id).map(e=><p key={e.url}>{e.date} · {e.title}</p>)}</details>}
       <details><summary>자료 출처</summary>{item.sources.map(([label,url])=><p key={url}><a href={url} target="_blank" rel="noreferrer">{label} ↗</a></p>)}</details>
      </section>}
     </section>
     <section className="town-card town-plan" id="town-plan">
      <PlanStep code={censusCode} projectIds={projectIds} onSelect={selectProject}/>
     </section>
     <section className="town-card town-progress" id="town-progress">
      <ChangeStep code={censusCode} projectIds={projectIds} townName={town.name}/>
     </section>
     <section className="town-card town-voice" id="town-feedback">
      <VoiceStep code={censusCode} townName={town.name}/>
     </section>
     <section className="town-card town-community" aria-labelledby="town-community-title">
      <div className="town-card-heading"><h2 id="town-community-title"><span>5</span> 함께 살펴볼 의견</h2><span className="town-prompt-badge">의견 수집 기능 미연결</span></div>
      <p>아래 항목은 동네를 살펴볼 때 참고할 질문입니다. 주민 투표나 게시글 통계가 아닙니다.</p>
      <ul className="town-prompt-list">
       <li><span>보행 안전</span><small>걷기 불편하거나 위험한 곳은 어디인가요?</small></li>
       <li><span>이동 편의</span><small>대중교통·이동 경로에서 개선할 점이 있나요?</small></li>
       <li><span>휴식 공간</span><small>쉬거나 머물기 좋은 공간은 충분한가요?</small></li>
      </ul>
      <a className="town-prompt-link" href="#town-feedback">나의 경험과 제안 작성하기 ↓</a>
      <small className="town-community-note">내 메모는 이 브라우저에만 저장되며 다른 사람이나 지자체에 공유되지 않습니다.</small>
     </section>
   </div>
   <footer className="town-footer"><span>출처 · 지표 정의 · 해석 방법 · 자료의 한계는 각 항목의 안내를 확인해 주세요.</span>{attribution}</footer>
 </main>
}
