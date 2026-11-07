import { useMemo } from 'react'
import { TownData } from './TownData'
import { Feedback } from './Feedback'
import metrics from './data/town-metrics.json'
import planRoles from './data/plan-neighborhood-roles.json'
import projects from './data/projects.json'
import events from './data/events.json'
import { HeunghaePlan, HeunghaeChanges } from './GokgangStudy'

type Project = (typeof projects.projects)[number]
type TownMetric = (typeof metrics)[number]

const parkPlan: Record<string, { count: number; area: string }> = {
  '북부생활권': { count: 53, area: '10.207' },
  '중심생활권': { count: 165, area: '5.114' },
  '남부생활권': { count: 80, area: '2.005' },
}
const regionalDirections: Record<string, string> = {
  '북부생활권': '흥해 역세권·신항만 기능, 청하·송라 정주환경 개선, 산림휴양·관광 분야를 포함한 개발전략.',
  '중심생활권': '원도심 재생과 문화·예술·상업 기능 강화, 도시 녹색공간 확충을 포함한 개발전략.',
  '남부생활권': '산업단지 배후 주거지, 수산업 거점, 해안 관광과 농촌 정주환경 개선을 포함한 개발전략.',
}

export function PlanStep({ code, projectIds, onSelect }: { code: string; projectIds: string[]; onSelect: (id: string) => void }) {
  const info = (metrics as TownMetric[]).find(m => m.adm_cd === code)
  if (!info) return <p className="journey-empty">해당 지역의 계획생활권 연결 자료가 없습니다.</p>
  if (info.adm_nm === '흥해읍' && projectIds.includes('gokgang')) return <HeunghaePlan onSelect={onSelect} />
  const role = (planRoles as Record<string, string>)[info.plan_neighborhood_reference]
  const regionPlan = parkPlan[info.plan_region]
  const related = projects.projects.filter(p => projectIds.includes(p.id))
  return <section className="journey-content" aria-label="도시기본계획 연결">
    <div className="journey-heading"><small>STEP 2 · 2030 포항 도시기본계획</small><h2>이 동네는 어떻게 계획됐을까?</h2><p>계획서의 지역별 발전방향과 계획 범위를 기준으로 정리한 내용</p></div>
    <div className="journey-connection"><small>도시기본계획의 공간구분</small><strong>포항시 <span>›</span> {info.plan_region} <span>›</span> {info.plan_neighborhood_reference} 근린생활권</strong><p>선택한 행정구역: {info.adm_nm}</p></div>
    <div className="journey-plan-card"><small>계획서 표 4-13 · 근린생활권 주 기능</small><h3>{role ?? '관련 계획 내용 확인 중'}</h3><p>{regionalDirections[info.plan_region] ?? '지역생활권별 개발 방향 확인 중'}</p></div>
    {info.plan_join_caution && <p className="journey-warning">경계 연결 주의: {info.plan_join_caution}. 계획상 근린생활권 경계와 현재 행정동 전체가 일치하지 않을 수 있어.</p>}
    {regionPlan && <div className="journey-plan-figure"><small>2030년 계획 · 상위 {info.plan_region} 기준</small><strong>공원 {regionPlan.count}개소 · {regionPlan.area}㎢</strong><p>{info.plan_region} 전체의 계획 수치(군립공원 등 포함). {info.adm_nm} 단독 목표가 아니며 현재 공원 CSV의 집계와 직접 비교할 수 없습니다.</p></div>}
    <div className="journey-subsection"><h3>관련 도시개발 및 생활 기반 사업</h3>
      {related.length ? related.map((p: Project) => <div className="journey-related" key={p.id}>
        <strong>{p.name}</strong><small>{p.id === 'gokgang' ? '2030 기본계획 표 7-18에 등장하는 사업' : '위치를 기준으로 연결한 후속 고시 · 기본계획 내 동일 사업 여부 미확인'}</small>
        <button type="button" onClick={() => onSelect(p.id)}>사업 자료 자세히 보기 ›</button>
      </div>) : <p className="journey-empty">공식 자료로 연결된 개별 사업 정보는 현재 준비 중입니다.</p>}
    </div>
    <p className="journey-source">출처: 「2030 포항 도시기본계획」 제4장 표 4-8(생활권 구분, 원문 PDF 118쪽), 표 4-13(생활권 개발전략, 125~126쪽), 제10장 표 10-22(공원계획, 445쪽). 계획 수립 당시 내용이므로 현재 확정·완료 상태가 아님.</p>
  </section>
}

export function ChangeStep({ code, projectIds, townName, onSelect }: { code: string; projectIds: string[]; townName: string; onSelect: (id: string) => void }) {
  const related = projects.projects.filter(p => projectIds.includes(p.id))
  const recordList = useMemo(() => events.filter(e => projectIds.includes(e.projectId)).slice().sort((a,b) => a.date.localeCompare(b.date)), [projectIds])
  if (townName === '흥해읍' && projectIds.includes('gokgang')) return <HeunghaeChanges onSelect={onSelect} />
  return <section className="journey-content" aria-label="실제 변화와 추진 기록">
    <div className="journey-heading"><small>STEP 3 · 실제 변화와 확인된 기록</small><h2>실제로 무엇이 달라졌을까?</h2><p>확인된 동네 통계와 개별 사업의 공식 변경 기록을 구분하여 제공합니다.</p></div>
    <TownData code={code} mode="changes" />
    <div className="journey-subsection"><h3>관련 사업의 공식 고시 이력</h3>
      {recordList.length ? <ol className="journey-timeline">{recordList.map(e => <li key={e.projectId + e.date + e.url}><time dateTime={e.date}>{e.date}</time><strong>{related.find(p=>p.id===e.projectId)?.name ?? e.projectId}</strong><span>{e.title}</span><a href={e.url} target="_blank" rel="noreferrer">{e.source} · 고시 원문 ↗</a></li>)}</ol> : <p className="journey-empty">{townName}에 연결된 공식 사업 고시 내용은 현재 확인 중입니다.</p>}
    </div>
    {related.length > 0 && <div className="journey-subsection"><h3>최근 확인된 문서상 상태</h3>{related.map(p => <div className="journey-related" key={p.id}><strong>{p.name}</strong><small>{p.status} · {p.source}</small><a href={p.url} target="_blank" rel="noreferrer">관련 고시 보기 ↗</a></div>)}</div>}
    <p className="journey-warning">통계 변화와 행정 고시는 다른 성격의 자료입니다. 고시만으로 공사 준공·시설 개방을 확인할 수 없으며, 인구 변화의 원인을 특정 사업으로 단정할 수 없습니다.</p>
  </section>
}

export function VoiceStep({ code, townName }: { code: string; townName: string }) {
  return <section className="journey-content" aria-label="시민 경험과 개선 의견">
    <div className="journey-heading"><small>STEP 4 · 시민의 경험과 제안</small><h2>나는 어떻게 생각할까?</h2><p>지도와 계획을 살펴봤다면, {townName}의 실제 생활 경험과 지역 개선 의견을 기록하는 공간</p></div>
    <Feedback id={'town:' + code} townName={townName}/>
  </section>
}
