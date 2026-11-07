import {useEffect,useMemo,useRef,useState,type ReactNode} from 'react'
import {MapContainer,GeoJSON,TileLayer,Marker,Tooltip,useMap} from 'react-leaflet'
import L from 'leaflet'
import {TownData} from './TownData'
import {PlanStep,ChangeStep,VoiceStep} from './TownJourney'
import {HeunghaeProjectDetail} from './HeunghaeProjectDetail'
import heunghaePlan from './data/heunghae-plan-v13.json'
import parks from './data/parks.json'
import type {Feature,MultiPolygon} from 'geojson'
import {Facts,gokgangFacts} from './Facts'
import stories from './data/stories.json'
import projects from './data/projects.json'
import events from './data/events.json'
import traffic from './data/traffic.json'

const groups=['행사·모집','생활시설','동네의 미래','공사·통행','공원'] as const
// 지도 마커와 오른쪽 목록의 범례에 동일한 원형 SVG 아이콘을 사용합니다.
const markerPaths = [
  '<rect x="5" y="6" width="14" height="14" rx="2"/><path d="M8 4v4M16 4v4M5 10h14M9 14h2M14 14h2"/>',
  '<path d="M5 20V7l7-3 7 3v13M3 20h18M9 10h1M14 10h1M9 14h1M14 14h1M11 20v-4h2v4"/>',
  '<path d="M4 20h16M6 20V9l6-5 6 5v11M9 12h6M9 16h6M12 4v16"/>',
  '<path d="M8 4h8l4 16H4L8 4Z M12 7v3M12 14v3"/>',
  '<circle cx="12" cy="6.7" r="3.1"/><circle cx="17.3" cy="12" r="3.1"/><circle cx="12" cy="17.3" r="3.1"/><circle cx="6.7" cy="12" r="3.1"/><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/>',
] as const
function markerHtml(group:number, chosen:boolean):string {
 const svg = `<svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${markerPaths[group] ?? markerPaths[0]}</svg>`
 return `<span class="category-pin category-pin-${group}${chosen?' chosen':''}">${svg}</span>`
}
function CategoryBadge({group}:{group:number}){
 return <span className="category-chip" aria-hidden="true" dangerouslySetInnerHTML={{__html:markerHtml(group,false)}} />
}
type Item={id:string; group:number; title:string; note:string; pos?:[number,number]; rows:[string,string][]; sources:[string,string][]}
const librarySource='https://pohang.go.kr/news/bbs/view.do?bbsType=235&idx=800396&mid=0101000000'
const life:Item[]=[
 {id:'heunghae-recovery',group:2,title:'흥해 지진피해지역 특별재생사업',note:'흥해읍 소재지 · 지진 피해 복구와 생활시설 확충',rows:[
 ['대상','북구 흥해읍 소재지 일원 · 약 120만㎡'],['계획기간','2019~2023년 · 시청 사업개요 기준'],['계획 사업비','2,257억원'],['재원','국비 767억 · 도비 104억 · 시비 1,286억 · 민간 100억'],['마을회관','9곳 · 내진보강·리모델링 계획'],['문화·체육','남성리 대웅파크 2차 부지 · 수영장·체육관·생활문화센터 계획'],['공공도서관','포은흥해도서관 · 2025년 3월 개관 확인'],['전체 준공','미확인 · 개별 시설 개관과 구분']
 ],sources:[['포항시 · 특별재생사업 개요','https://www.pohang.go.kr/dept/contents.do?mid=0302020500'],['포항시 · 도서관 개관',librarySource]]},
 {id:'market',group:0,title:'흥해시장 오일장',note:'정기 장날 · 매월 2일·7일부터 닷새 간격',pos:[36.110619,129.348288],rows:[['장소','흥해시장 · 한동로 61-13'],['장날','매월 2·7·12·17·22·27일'],['당일 운영','임시 휴장과 운영시간은 미확인']],sources:[['한국관광공사 · 정기 장날','https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=fd110ff7-239f-4239-b709-3562fa9de93c'],['시장 위치 자료','https://ger.clubrichtour.co.kr/bbs/board.php?bo_table=public_trdit_mrkt&wr_id=1146']]},
 {id:'lib',group:1,title:'포은흥해도서관',note:'음악 특성화 도서관 · 흥해로81번길',pos:[36.1118304,129.3428173],rows:[['위치','흥해읍 흥해로81번길 46'],['시설','음악 특성화 공공도서관'],['개관','2025년 3월'],['공간 변화','지진 피해 공동주택 부지 → 도서관·아이누리플라자'],['지난 프로그램','낙엽 위의 인문학 · 2026.10.07 종료']],sources:[['포항시 · 개관 안내',librarySource],['주소 대표점','https://findby.co.kr/details/37537-471134712844-st-67aa2d8b62c51c5729964455'],['지난 프로그램','https://jp.pohang.go.kr/phtrauma/main/lectureInfo/index.do?menu_idx=38']]},
 // 프로그램은 공지 이력이고, 현재 접수 가능 여부를 보장하지 않습니다. 정확한 대표좌표가 없는 항목은 지도에 찍지 않습니다.
 {id:'heunghae-music-2026',group:0,title:'포은흥해도서관 음악특성화 프로그램',note:'2026년 10~11월 프로그램 안내 · 접수 상태 별도 확인',rows:[['장소','포은흥해도서관'],['안내','2026년 10월 음악특성화 프로그램 수강생 모집 공지'],['운영 안내 기간','2026.10.06 ~ 11.24 · 포항시 문화행사 달력 표시 기준'],['신청 가능 여부','현재 접수 상태 별도 확인']],sources:[['포항시 공식 문화행사 달력','https://pohang.go.kr/phtour/module/calendarManage/index.do?menu_idx=25']]},
 {id:'heunghae-music-therapy-2026',group:0,title:'포항트라우마센터 「마음의 선율」',note:'2026.11.04 피아노 연주자 모집 공고 · 접수 상태 별도 확인',rows:[['관련 시설','포항트라우마센터 · 흥해읍 한동로 1'],['공고일','2026.11.04'],['내용','음악치유프로그램 「마음의 선율」 피아노 연주자 모집'],['신청 가능 여부','공식 공지에서 접수기간 확인 필요']],sources:[['포항트라우마센터 공식 공지','https://poma.pohang.go.kr/phtrauma/main/index.do']]},
 {id:'yeongil-library',group:1,title:'경상북도교육청 영일도서관',note:'흥해로 101 · 자료실·평생학습·독서 프로그램',rows:[['주소','흥해읍 흥해로 101'],['이용 시설','종합자료실·어린이자료실·평생학습실'],['전화','054-261-8856'],['자료 기준','교육청 영일도서관 공식 안내']],sources:[['경상북도교육청 영일도서관','https://www.gbelib.kr/yi/html.do?menu_idx=99']]},
 {id:'heunghae-office',group:1,title:'흥해읍 행정복지센터',note:'동해대로 1511 · 주민 민원·복지 안내',rows:[['주소','흥해읍 동해대로 1511'],['주요 기능','주민 행정·민원 및 복지 상담'],['자료 기준','포항시 공식 행정시설 및 채용행사 공지']],sources:[['포항시청 공식 공지','https://pohang.go.kr/portal/board/post/list.do?bcIdx=100&mid=0201010000']]},
 {id:'bukgu-health',group:1,title:'북구보건소·포항트라우마센터',note:'한동로 1 · 건강관리와 심리회복 지원',rows:[['주소','흥해읍 한동로 1'],['북구보건소 이전','2025.03.31'],['시설','보건·건강관리 및 트라우마 지원시설'],['전화','북구보건소 대표 054-270-4114']],sources:[['포항시 북구보건소 찾아오시는 길','https://mayor.pohang.go.kr/health/contents.do?mid=0602000000'],['포항시 북구보건소 연혁','https://mayor.pohang.go.kr/health/contents.do?mid=0102020000']]},
 {id:'heunghae-culture',group:1,title:'흥해종합복지문화센터',note:'흥해읍 성내리 일원 · 주민 복지·문화 활동 공간',rows:[['위치','흥해읍 성내리 일원'],['시설 성격','지역 주민을 위한 복지·문화 시설'],['운영 정보','최신 강좌·개방 시간은 운영기관에 확인']],sources:[['포항시시설관리공단','https://www.phsisul.org/main/main.do']]}

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
export function TownWorkspace({town,boundary,plans,attribution}:{town:{id:string;name:string;gu:string};boundary:Feature<MultiPolygon>;plans:Record<string,string>;attribution:ReactNode}){
 const censusCode=String(boundary.properties?.adm_cd ?? '')
 const localParks=useMemo(()=>parks.filter(p=>p.adm_cd===censusCode),[censusCode])
 const [showParkPins,setShowParkPins]=useState(true)
 const items=useMemo(()=>[...(town.name==='흥해읍'?life:[]),...activeTraffic(town.id),...localParks.map((p):Item=>({id:'park:'+p.id,group:4,title:p.name,note:p.kind+' · '+p.address,pos:[p.lat,p.lng],rows:[['공원 종류',p.kind],['공원 면적',p.area_m2.toLocaleString('ko-KR')+'㎡'],['주소',p.address],['데이터 기준일',p.date],['자료 범위','공원 CSV에 수록된 시설이며 전체 공원 통계와 다를 수 있음']],sources:[['전국도시공원정보표준데이터','https://www.data.go.kr/data/15012890/standard.do']]})),...(town.name==='흥해읍' ? heunghaePlan.projects.filter(p=>p.id!=='gokgang').map((p):Item=>({
  id:p.id,group:2,title:`${p.name} 도시개발사업`,note:`${p.place} · 도시기본계획 수록`,
  rows:[['사업 위치',p.place],['계획서 수록 면적',p.planArea.toLocaleString('ko-KR')+'㎡'],['계획서 수록 사업기간',p.planPeriod],['계획서상 성격',p.theme],['최신 공사·준공 상태','본 사업의 공식 후속 자료로 별도 확인']],
  sources:p.notice?[[p.notice.number+' · '+p.notice.title,p.notice.url]]:[],
 })) : []),...projects.projects.filter(p=>plans[p.id]===town.name).map((p):Item=>{
 const story=stories[p.id as keyof typeof stories]
 return {id:p.id,title:p.name,group:2,pos:p.position as [number,number] | undefined,note:story.place,rows:p.id==='gokgang'?[...gokgangFacts,['지도 표시','고시 지번의 대표점 · 사업구역 경계 및 출입구 아님'],['기한의 의미','사업 종료 예정일 · 입주일 또는 도로 개통일 아님'],['기본계획상 역할','흥해 주거지 개발 · 원도심과 흥해 시가지 연결'],['도시기본계획 수록 당시','265,600㎡ · 2014.12~2017.12 · 당시 진행 중(최신 고시 수치와 구분)'],['도시기본계획상 유발인구','6,038명 · 당시 추정 · 개별 계획 수용인구 6,356명과 기준이 다름'],['예상 외부 유입','2,234명 · 외부 유입률 37% · 실제 전입 통계 아님']]:[['위치',story.place],...story.sections.map(([q,a])=>[q,a] as [string,string]),['현장 확인',story.field]],sources:[...events.filter(e=>e.projectId===p.id).map((e):[string,string]=>[e.source+' · '+e.title,e.url]),...(p.id==='gokgang'?[['2030 포항 도시기본계획 · 표 3-12(71쪽), 표 7-18(267쪽)','https://eum.go.kr/web/in/pd/pdBoardDet.jsp?bd_type=3&gbn=I&seq=110'] as [string,string],['지번 대표점 · 카카오맵','https://map.kakao.com/link/search/포항시 북구 흥해읍 곡강리 산148-2'] as [string,string]]:[])]}
 })],[plans,town.name,town.id,localParks])
 const [selected,setSelected]=useState<string|null>(null)
 const [activeStep,setActiveStep]=useState(1)
 const [showingReturnTo,setShowingReturnTo]=useState(2)
 const rightPanelRef=useRef<HTMLDivElement>(null)
 const item=items.find(i=>i.id===selected)
 const selectedDistrict=town.name==='흥해읍'&&heunghaePlan.projects.some(p=>p.id===selected)
 const bounds=useMemo(()=>L.geoJSON(boundary).getBounds(),[boundary])
 const projectIds=useMemo(()=>projects.projects.filter(p=>plans[p.id]===town.name).map(p=>p.id),[plans,town.name])
 const stepNames=['우리 동네는 지금?','어떻게 계획됐을까?','무엇이 달라졌을까?','나는 어떻게 생각할까?'] as const
 function resetPanelScroll(){rightPanelRef.current?.scrollTo({top:0,behavior:'auto'})}
 function navigateToStep(num:number){
  if(num<1||num>4)return
  setSelected(null)
  setActiveStep(num)
  resetPanelScroll()
 }
 function select(id:string,returnStep=activeStep){
  setShowingReturnTo(returnStep)
  setSelected(id)
  resetPanelScroll()
 }
 function selectProject(id:string){select(id,2)}
 function backToTown(){
  setSelected(null)
  setActiveStep(showingReturnTo)
  resetPanelScroll()
 }
 return <main className="local-board">
  <header className="town-header">
   <a className="town-back" href="#pohang" aria-label="포항 지도 화면으로 돌아가기">← 포항 지도</a>
   <div><small>경상북도 · 포항시 · {town.gu}</small><h1>{town.name}</h1></div>
   <span className="journey-version">2030 포항 도시기본계획 · 동네 알기</span>
  </header>

  <div className="town-side-by-side">
   <aside className="town-side-map town-card" aria-label={`${town.name} 지도`}>
    <div className="town-map-heading">
     <div><small>MAP · {town.name}</small><h2>우리 동네 지도</h2></div>
     <span className="town-map-badge">지도에서 장소 선택</span>
    </div>
    <div className="town-current-map">
     <MapContainer bounds={bounds} boundsOptions={{padding:[18,18]}} className="local-map" scrollWheelZoom>
      <TileLayer attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
      <GeoJSON data={boundary} interactive={false} style={{color:'#315f91',weight:2,fillColor:'#7fa9d1',fillOpacity:.07}}/>
      <Navigate item={item} bounds={bounds}/>
      {items.filter(i=>i.pos&&(i.group!==4||showParkPins)).map(i=><Marker key={i.id} position={i.pos!} title={i.title} alt={i.title} zIndexOffset={selected===i.id?200:0} icon={L.divIcon({className:'local-marker',html:markerHtml(i.group,i.id===selected),iconSize:[34,34],iconAnchor:[17,17]})} eventHandlers={{click:()=>select(i.id,activeStep)}}><Tooltip>{i.title}</Tooltip></Marker>)}
     </MapContainer>
     <div className="local-key" id="town-parks">
      {groups.map((g,i)=><span key={g}><CategoryBadge group={i}/> {g}</span>)}
      <button type="button" onClick={()=>setShowParkPins(v=>!v)} aria-pressed={showParkPins}>{showParkPins?'공원 마커 숨기기':'공원 마커 표시'}</button>
     </div>
     <small>{attribution}</small>
    </div>
    <p className="town-map-caption">지도에 표시된 장소는 마커로, 위치 정보가 없는 자료는 오른쪽 목록에서 확인할 수 있습니다.</p>
   </aside>

   <div className="town-right-column">
    {selected ? <section className="town-card town-detail-page town-pane" aria-label="개별 장소·사업 상세페이지">
     <div className="town-card-heading town-detail-heading">
      <div><small>{town.name} · 개별 사업 및 장소 자료</small><h2>상세 정보</h2></div>
      <button type="button" onClick={backToTown}>← {town.name} 전체로 돌아가기</button>
     </div>
     <div className="town-pane-scroll" ref={rightPanelRef}>
      {selectedDistrict ? <HeunghaeProjectDetail projectId={selected}/> : item ? <section className="town-general-detail">
       <span className="town-detail-kind">{groups[item.group]} · {item.pos?'지도 위치 확인':'좌표 미확인'}</span>
       <h2>{item.title}</h2><p>{item.note}</p>
       <Facts rows={item.rows}/>
       {events.some(e=>e.projectId===item.id)&&<details><summary>확인된 고시 기록</summary>{events.filter(e=>e.projectId===item.id).map(e=><p key={e.url}>{e.date} · {e.title}</p>)}</details>}
       <details><summary>자료 출처</summary>{item.sources.map(([label,url])=><p key={url}><a href={url} target="_blank" rel="noreferrer">{label} ↗</a></p>)}</details>
      </section> : <p className="journey-empty">선택한 자료를 찾을 수 없습니다.</p>}
     </div>
     <div className="town-detail-bottom"><button type="button" onClick={backToTown}>← {town.name} 계획·현황 다시 보기</button></div>
    </section> : <>
     <nav className="town-toolbar town-step-nav" aria-label="동네 알기 네 단계">
      {stepNames.map((name,i)=><button type="button" key={name} className={`town-step-nav-item${activeStep===i+1?' is-active':''}`} aria-pressed={activeStep===i+1} aria-controls="town-active-step-panel" onClick={()=>navigateToStep(i+1)}>
       <span>0{i+1}</span><strong>{name}</strong>
      </button>)}
     </nav>
     <section className="town-card town-step-view town-pane" id="town-active-step-panel" aria-label={`STEP ${activeStep} ${stepNames[activeStep-1]}`}>
      <div className="town-pane-scroll" ref={rightPanelRef}>
       {activeStep===1&&<section className="town-current" aria-labelledby="town-current-title">
        <header className="town-card-heading"><h2 id="town-current-title"><span>01</span> 우리 동네는 지금?</h2><small>현황 · 공원 · 생활시설</small></header>
        <div className="town-current-data"><TownData code={censusCode}/></div>
        <div className="town-place-index">
         <div className="town-section-heading"><div><small>흥해읍 생활·계획 자료</small><h3>장소 살펴보기</h3></div><span>{items.length}개 항목</span></div>
         <div className="town-place-groups">
          {groups.map((g,i)=>{const filtered=items.filter(x=>x.group===i)
           return <details className="journey-place-group" key={g}>
            <summary><CategoryBadge group={i}/> {g}<span>{filtered.length}개</span></summary>
            {filtered.length?filtered.map(x=><button type="button" className="local-row" key={x.id} onClick={()=>select(x.id,1)}><strong>{x.title}</strong><span>{x.note}</span><i>›</i></button>):<p className="journey-empty">{i===3?'확인된 통제 공지 없음':i===4?'제공된 공원 데이터에 항목 없음':'현재 연결된 장소 자료 없음'}</p>}
           </details>
          })}
         </div>
        </div>
       </section>}
       {activeStep===2&&<section className="town-plan" aria-label="도시기본계획과 지구별 사업 목록">
        <header className="town-card-heading"><h2><span>02</span> 어떻게 계획됐을까?</h2></header>
        <PlanStep code={censusCode} projectIds={projectIds} onSelect={selectProject}/>
       </section>}
       {activeStep===3&&<section className="town-progress" aria-label="우리 동네의 실제 변화">
        <header className="town-card-heading"><h2><span>03</span> 무엇이 달라졌을까?</h2></header>
        <ChangeStep code={censusCode} projectIds={projectIds} townName={town.name} onSelect={(id)=>select(id,3)}/>
       </section>}
       {activeStep===4&&<section className="town-voice" aria-label="생활 경험과 개선 의견">
        <header className="town-card-heading"><h2><span>04</span> 나는 어떻게 생각할까?</h2></header>
        <VoiceStep code={censusCode} townName={town.name}/>
       </section>}
      </div>
      <div className="town-step-actions">
       <button type="button" onClick={()=>navigateToStep(activeStep-1)} disabled={activeStep===1}>← 이전 단계</button>
       <span aria-live="polite">STEP {activeStep} / 4</span>
       <button type="button" className="town-step-next" onClick={()=>navigateToStep(activeStep+1)} disabled={activeStep===4}>다음 단계 →</button>
      </div>
     </section>
    </>}
   </div>
  </div>
  <footer className="town-footer"><span>계획서 수록 수치와 실제 통계·고시의 기준연도는 구분하여 확인해 주세요.</span>{attribution}</footer>
 </main>
}
