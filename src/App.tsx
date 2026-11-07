import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'
import type { FeatureCollection, Geometry } from 'geojson'
import type { Map as LeafletMap, LatLngExpression } from 'leaflet'
import population from './data/population.json'
import { ProjectStory } from './ProjectStory'
import { TownHome, TownPicker, TownLayer, LocateButton, credit } from './Towns'
import { CityCharts } from './CityCharts'
import regions from './data/regions.json'
import boundaryJson from './data/administrative-boundaries.geojson?raw'
import projectData from './data/projects.json'

type Region = {
  name: string
  center: [number, number]
  zoom: number
}

type Project = {
  id: string
  name: string
  summary: string
  status: string
  source: string
  url: string
  position: [number, number] | null
}

const projects = projectData.projects as Project[]
const boundaries = JSON.parse(boundaryJson) as FeatureCollection<Geometry>
const regionList: Region[] = regions.map((region) => ({
  ...region,
  center: [region.center[0]!, region.center[1]!] as [number, number],
}))
const koreaCenter: LatLngExpression = [36.4, 127.8]
const gyeongbuk: Region = {
  name: '경상북도',
  center: [36.4919, 128.8889],
  zoom: 8,
}
const pohangCenter: LatLngExpression = [36.019, 129.3435]

function MapView({ center, zoom }: { center: LatLngExpression; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom, { animate: true })
  }, [center, map, zoom])
  return null
}

function App() {
  const overviewMap=useRef<LeafletMap>(null)
  const [myPoint,setMyPoint]=useState<[number,number]|null>(null)
  const [townId,setTownId]=useState<string | null>(null)
  const [selectedProvince, setSelectedProvince] = useState<Region | null>(null)
  const [isPohangSelected, setIsPohangSelected] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(()=>location.hash.split('/')[1] ?? null)
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [selectedProjectId],
  )

  useEffect(()=>{
    function route(){
      const town=location.hash.match(/^#town\/([^/]+)$/)?.[1]; setTownId(town ?? null)
      const id=location.hash.match(/^#project\/([^/]+)$/)?.[1]
      setSelectedProjectId(id ?? null)
      if(town || id || location.hash==='#pohang'){setIsPohangSelected(true);setSelectedProvince(gyeongbuk)}
    }
    route()
    window.addEventListener('hashchange',route)
    return ()=>window.removeEventListener('hashchange',route)
  },[])
  if(townId)return <TownHome key={townId} id={townId}/>
  if(selectedProject)return <ProjectStory project={selectedProject}/>
  const mapCenter = isPohangSelected
    ? pohangCenter
    : selectedProvince?.center ?? koreaCenter
  const mapZoom = isPohangSelected ? 11 : selectedProvince?.zoom ?? 7

  const regionName = isPohangSelected ? '포항시' : selectedProvince?.name ?? '전국'
  const pop = population.find(row => row.region === regionName)
  function reset() { setSelectedProvince(null); setIsPohangSelected(false); setSelectedProjectId(null) }
  function chooseProvince(region: Region) {
    setSelectedProvince(region)
    setIsPohangSelected(false)
    setSelectedProjectId(null)
  }

  function selectPohang() {
    setSelectedProvince(gyeongbuk)
    setIsPohangSelected(true)
    setSelectedProjectId(null)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={reset} aria-label="포항 도시계획 홈">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M4 23.5 13 8l5 8 3-4.5L28 23.5H4Z" />
              <path d="M9 23.5h16M13 18h6" />
            </svg>
          </span>
          <span className="brand-copy">
            <strong>동네알기</strong>
            <span>POHANG · URBAN ARCHIVE</span>
          </span>
        </a>
        <nav className="top-nav" aria-label="페이지 탐색">
          <a href="#explore-map">지역 탐색</a>
          <a href="#city-indicators">이용 안내</a>
          <a href="#data-sources">자료 기준</a>
        </nav>
        <div className="header-note">
          <span className="live-dot" />
          <span>계획을 읽고, 동네를 보다</span>
          <span className="header-divider" />
          <span>2026</span>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="eyebrow"><span>01</span> 지역 선택</div>
          <h1>어디를<br />살펴볼까요?</h1>
          <p className="intro">
            지도를 탐색해 지역을 선택하고<br />도시의 계획을 확인해 보세요.
          </p>

          <LocateButton onLocate={point=>{setMyPoint(point);overviewMap.current?.stop().setView(point,15,{animate:false})}}/>
          {!isPohangSelected && <TownPicker compact/>}
          <div className="region-section">
            <div className="section-label">
              <span>시·도 탐색</span>
              <span className="small-count">2021년 경계 · 17개</span>
            </div>
            <div className="region-list">
              {regionList.map((region) => (
                <button
                  className={`region-button ${selectedProvince?.name === region.name ? 'active' : ''}`}
                  key={region.name}
                  onClick={() => chooseProvince(region)}
                  type="button"
                >
                  <span>{region.name}</span>
                  {selectedProvince?.name === region.name && (
                    <span className="region-check" aria-label="선택됨">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {selectedProvince?.name === gyeongbuk.name && (
            <div className="city-card">
              <div className="city-card-heading">
                <span className="city-pin" aria-hidden="true">⌖</span>
                <div>
                  <strong>경상북도</strong>
                  <span>도시를 선택해 자세히 보기</span>
                </div>
              </div>
              <button
                type="button"
                className={`pohang-button ${isPohangSelected ? 'active' : ''}`}
                onClick={selectPohang}
              >
                <span>포항시</span>
                <span aria-hidden="true">↗</span>
              </button>
            </div>
          )}

          <div className="sidebar-foot">
            <span className="foot-icon">i</span>
            <span>지역 좌표는 지도 이동을 위한 참고점입니다.<br />시·도 2021년 · 포항 2020년 경계입니다.</span>
          </div>
        </aside>

        <section className="main-content" aria-label="지도와 도시계획 정보">
          <div className="page-heading" id="explore-map">
            <div className="hero-copy">
              <span className="hero-kicker">POHANG CITY · NEIGHBORHOOD ARCHIVE</span>
              <div className="breadcrumb">
                <button onClick={reset}>전국</button>
                {selectedProvince && <><span className="crumb-slash">/</span><button onClick={() => chooseProvince(selectedProvince)}>{selectedProvince.name}</button></>}
                {isPohangSelected && <><span className="crumb-slash">/</span><span className="current-crumb">포항시</span></>}
              </div>
              <h2>{isPohangSelected ? '포항에서 내 동네를 찾아보세요' : selectedProvince ? `${selectedProvince.name} 지역을 살펴보세요` : '대한민국 도시계획 지도'}</h2>
              <p>지도를 따라 우리 동네의 지금과, 도시가 그려온 내일을 살펴봅니다.</p>
            </div>
            <span className="demo-badge">{selectedProvince && selectedProvince.name !== gyeongbuk.name ? '이 지역 상세 서비스는 준비 중' : '포항 시범 서비스'}</span>
          </div>

          <div className="story-index" aria-label="탐색 순서">
            <span><b>01</b> 지역을 고르고</span>
            <i aria-hidden="true" />
            <span><b>02</b> 지도에서 찾고</span>
            <i aria-hidden="true" />
            <span><b>03</b> 자료로 확인합니다</span>
          </div>

          <div className="location-summary" id="location-summary"><div><span>{regionName} 인구</span><strong>{pop ? pop.value.toLocaleString('ko-KR')+'명' : '자료 미확보'}</strong></div>{pop && <small>{pop.date} 기준 · 외국인 제외 · <a href={pop.url} target="_blank" rel="noreferrer">통계 출처 ↗</a></small>}</div>
          <div className="map-layout">
            <section className="map-card" aria-label="지역 지도">
              <div className="map-topline">
                <span className="map-location">
                  <span className="location-dot" />
                  {regionName} · {isPohangSelected ? '2026.10' : '2021'}년 경계
                </span>
                {isPohangSelected && <span className="map-hint">읍·면·동을 선택하세요</span>}
              </div>
              <MapContainer ref={overviewMap}
                center={koreaCenter}
                zoom={7}
                scrollWheelZoom
                className="map"
                zoomControl
              >
                <MapView center={mapCenter} zoom={mapZoom} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {isPohangSelected && <TownLayer/>}
                {!isPohangSelected && boundaries.features.length > 0 && (
                  <GeoJSON
                    key={regionName}
                    data={{...boundaries,features:boundaries.features.filter(f=>f.properties?.name!=='포항시' || selectedProvince?.name===gyeongbuk.name)} as FeatureCollection<Geometry>}
                    onEachFeature={(f,l)=>{ const n=String(f.properties?.name);l.bindTooltip(n);l.on('click',()=>{if(n==='포항시')selectPohang();else {const r=regionList.find(v=>v.name===n);if(r)chooseProvince(r)}})}}

                    style={f=>({
                      color: '#315f91',
                      weight: 2,
                      fillColor: '#7fa9d1',
                      fillOpacity: f?.properties?.name===regionName ? .4 : .07,
                    })}
                  />
                )}
                {myPoint && <CircleMarker center={myPoint} radius={8} pathOptions={{color:'#fff',weight:3,fillColor:'#1678df',fillOpacity:1}}><Tooltip>내 위치</Tooltip></CircleMarker>}
              </MapContainer>
              {myPoint && <div className="map-legend"><span aria-hidden="true" style={{color:'#1678df'}}>●</span> 내 위치</div>}
            </section>

            <aside className="detail-card" aria-live="polite">
              {isPohangSelected ? <TownPicker/> : <><h3>내 동네를 선택하세요</h3><p>경상북도에서 포항으로 들어가거나, 동네 이름으로 바로 검색할 수 있어요.</p></>}
            </aside>
          </div>

          {isPohangSelected && <section className="indicators" id="city-indicators" aria-label="동네알기 이용 안내"><CityCharts/></section>}
          <details className="boundary-note" id="data-sources"><summary>지도 경계의 기준연도와 출처</summary><p>시·도는 2021년, 경북 화면의 포항 외곽은 2020년 경계입니다. 광주와 전남은 당시 경계로 나뉘어 있으며 현재 행정구역과 다를 수 있습니다. 지역 이름은 서비스의 탐색용 표기입니다.</p><p>{credit}</p><p>geoBoundaries / Natural Earth · 포항: geoBoundaries / citypopulation.de (CC BY 3.0)</p></details>
          <footer className="page-footer">
            <span>포항 도시기본계획 시각화 · 자료 기반 화면</span>
            <span>지도 타일 © OpenStreetMap contributors</span>
          </footer>
        </section>
      </div>
    </main>
  )
}

export default App
