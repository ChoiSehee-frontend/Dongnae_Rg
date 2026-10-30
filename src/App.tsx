import { useEffect, useMemo, useState } from 'react'
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'
import type { FeatureCollection, Geometry } from 'geojson'
import type { LatLngExpression } from 'leaflet'
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
  position: [number, number]
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
  const [selectedProvince, setSelectedProvince] = useState<Region | null>(null)
  const [isPohangSelected, setIsPohangSelected] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [selectedProjectId],
  )

  const mapCenter = isPohangSelected
    ? pohangCenter
    : selectedProvince?.center ?? koreaCenter
  const mapZoom = isPohangSelected ? 11 : selectedProvince?.zoom ?? 7

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
        <a className="brand" href="#" aria-label="포항 도시계획 홈">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M5 24.5 13.5 7l5 10 3-5L27 24.5H5Z" />
              <path d="M10 24.5h15" />
            </svg>
          </span>
          <span className="brand-copy">
            <strong>포항 도시기본계획</strong>
            <span>URBAN PLAN · POHANG</span>
          </span>
        </a>
        <div className="header-note">
          <span className="live-dot" />
          <span>계획 정보를 한눈에</span>
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

          <div className="region-section">
            <div className="section-label">
              <span>전국 시·도</span>
              <span className="small-count">17개 지역</span>
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
            <span>지역 좌표는 지도 이동을 위한 참고점입니다.<br />경계 데이터는 아직 연결되지 않았습니다.</span>
          </div>
        </aside>

        <section className="main-content" aria-label="지도와 도시계획 정보">
          <div className="page-heading">
            <div>
              <div className="breadcrumb">
                <span>전국</span>
                {selectedProvince && <><span className="crumb-slash">/</span><span>{selectedProvince.name}</span></>}
                {isPohangSelected && <><span className="crumb-slash">/</span><span className="current-crumb">포항시</span></>}
              </div>
              <h2>{isPohangSelected ? '포항의 계획을 살펴보세요' : selectedProvince ? `${selectedProvince.name} 지역을 살펴보세요` : '대한민국 도시계획 지도'}</h2>
            </div>
            <span className="demo-badge"><span />자료 준비 중</span>
          </div>

          <div className="map-layout">
            <section className="map-card" aria-label="지역 지도">
              <div className="map-topline">
                <span className="map-location">
                  <span className="location-dot" />
                  {isPohangSelected ? '경상북도 · 포항시' : selectedProvince?.name ?? '대한민국'}
                </span>
                {isPohangSelected && <span className="map-hint">도시개발사업 위치</span>}
              </div>
              <MapContainer
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
                {boundaries.features.length > 0 && (
                  <GeoJSON
                    data={boundaries}
                    style={{
                      color: '#237967',
                      weight: 2,
                      fillColor: '#78b7a0',
                      fillOpacity: 0.18,
                    }}
                  />
                )}
                {isPohangSelected && projects.map((project) => (
                  <CircleMarker
                    center={project.position}
                    key={project.id}
                    radius={selectedProjectId === project.id ? 9 : 7}
                    pathOptions={{
                      color: '#fff',
                      weight: 3,
                      fillColor: selectedProjectId === project.id ? '#b7653f' : '#287e6c',
                      fillOpacity: 1,
                    }}
                    eventHandlers={{ click: () => setSelectedProjectId(project.id) }}
                  >
                    <Tooltip>{project.name}</Tooltip>
                  </CircleMarker>
                ))}
              </MapContainer>
              <div className="map-legend">
                <span className="legend-dot" />
                <span>{projects.length > 0 && isPohangSelected ? '도시개발사업' : '사업 위치 자료 없음'}</span>
              </div>
              <div className="map-credit">지도 © OpenStreetMap contributors</div>
              {isPohangSelected && projects.length === 0 && (
                <div className="map-empty">
                  <span className="empty-symbol">⌖</span>
                  <strong>표시할 사업 위치가 없습니다</strong>
                  <span>실제 사업 좌표 데이터가 추가되면 지도에 표시됩니다.</span>
                </div>
              )}
            </section>

            <aside className="detail-card" aria-live="polite">
              <div className="detail-header">
                <div className="eyebrow"><span>02</span> 사업 정보</div>
                <span className="detail-count">{isPohangSelected ? `${projects.length}건` : '—'}</span>
              </div>
              {selectedProject ? (
                <div className="project-detail">
                  <span className="project-category">도시개발사업</span>
                  <h3>{selectedProject.name}</h3>
                  <div className="detail-field">
                    <span>계획 요약</span><p>{selectedProject.summary}</p>
                  </div>
                  <div className="detail-field">
                    <span>계획상 상태</span><p className="status-value">{selectedProject.status}</p>
                  </div>
                  <div className="detail-field">
                    <span>출처</span><p>{selectedProject.source}</p>
                  </div>
                </div>
              ) : (
                <div className="detail-empty">
                  <div className="empty-illustration" aria-hidden="true">
                    <span className="illustration-ring ring-one" />
                    <span className="illustration-ring ring-two" />
                    <span className="illustration-center">⌖</span>
                  </div>
                  <strong>{isPohangSelected ? '사업 자료를 기다리고 있어요' : '지도에서 지역을 선택해 주세요'}</strong>
                  <p>{isPohangSelected
                    ? '실제 도시개발사업 데이터를 연결하면 지도 마커를 눌러 계획 정보를 확인할 수 있습니다.'
                    : '경상북도를 선택한 뒤 포항시로 이동하면 사업 정보와 지역 지표를 볼 수 있어요.'}</p>
                </div>
              )}
              {isPohangSelected && projects.length > 0 && (
                <div className="project-list">
                  <div className="section-label">사업 목록 <span className="small-count">{projects.length}건</span></div>
                  {projects.map((project) => (
                    <button
                      type="button"
                      key={project.id}
                      className={`project-row ${selectedProjectId === project.id ? 'active' : ''}`}
                      onClick={() => setSelectedProjectId(project.id)}
                    >
                      <span className="project-row-dot" />
                      <span>{project.name}</span>
                      <span aria-hidden="true">›</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="detail-footnote">
                <span className="foot-icon">i</span>
                <span>계획상 상태는 계획서 기준이며<br />현재 추진 상황과 다를 수 있습니다.</span>
              </div>
            </aside>
          </div>

          <section className="indicators" aria-label="포항 지역 지표">
            <div className="indicator-intro">
              <div className="eyebrow"><span>03</span> 지역 지표</div>
              <h3>도시를 읽는 숫자</h3>
              <p>계획과 함께 살펴보는 포항의 변화</p>
            </div>
            <Indicator title="인구" unit="명" description="인구 현황 및 추이" icon="01" />
            <Indicator title="환경 지표" unit="" description="환경계획 핵심 지표" icon="02" />
            <div className="indicator-disclaimer">
              <span className="example-tag">예시 데이터</span>
              <span>실제 통계 자료를 연결하면<br />이 영역에 표시됩니다.</span>
            </div>
          </section>
          <footer className="page-footer">
            <span>포항 도시기본계획 시각화 · 자료 기반 화면</span>
            <span>지도 타일 © OpenStreetMap contributors</span>
          </footer>
        </section>
      </div>
    </main>
  )
}

function Indicator({
  title,
  unit,
  description,
  icon,
}: {
  title: string
  unit: string
  description: string
  icon: string
}) {
  return (
    <div className="indicator-card">
      <div className="indicator-card-top">
        <span className="indicator-number">{icon}</span>
        <span className="example-tag">예시 데이터</span>
      </div>
      <div className="indicator-title">{title}</div>
      <div className="indicator-value">자료 연계 예정 <span>{unit}</span></div>
      <div className="indicator-description">{description}</div>
    </div>
  )
}

export default App
