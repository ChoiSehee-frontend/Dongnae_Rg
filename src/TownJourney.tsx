import { useMemo } from 'react'
import { TownData } from './TownData'
import { Feedback } from './Feedback'
import metrics from './data/town-metrics.json'
import planRoles from './data/plan-neighborhood-roles.json'
import projects from './data/projects.json'
import events from './data/events.json'

type Project = (typeof projects.projects)[number]
type TownMetric = (typeof metrics)[number]

const parkPlan: Record<string, { count: number; area: string }> = {
  '북부생활권': { count: 53, area: '10.207' },
  '중심생활권': { count: 165, area: '5.114' },
  '남부생활권': { count: 80, area: '2.005' },
}
const regionalDirections: Record<string, string> = {
  '북부생활권': '흥해 역세권과 신항만 기능, 청하·송라 농촌 정주환경, 산림휴양·관광 기능 등을 고려한 개발전략을 제시했어.',
  '중심생활권': '도시생활환경 개선, 원도심 재생, 문화·예술·상업 기능과 녹색공간 확충을 포함한 개발전략을 제시했어.',
  '남부생활권': '산업단지 배후 주거지, 수산업 거점, 해안 관광과 농촌 정주환경 개선 등을 포함한 개발전략을 제시했어.',
}

export function PlanStep({ code, projectIds, onSelect }: { code: string; projectIds: string[]; onSelect: (id: string) => void }) {
  const info = (metrics as TownMetric[]).find(m => m.adm_cd === code)
  if (!info) return <p className="journey-empty">계획생활권 연결 자료가 없어.</p>
  const role = (planRoles as Record<string, string>)[info.plan_neighborhood_reference]
  const regionPlan = parkPlan[info.plan_region]
  const related = projects.projects.filter(p => projectIds.includes(p.id))
  return <section className="journey-content" aria-label="도시기본계획 연결">
    <div className="journey-heading"><small>STEP 2 · 2030 포항 도시기본계획</small><h2>이 동네는 어떻게 계획됐을까?</h2><p>계획서에 실제로 제시된 범위까지만 연결했어. 행정동 단독 목표가 없는 항목은 따로 표시해.</p></div>
    <div className="journey-connection"><small>도시기본계획의 공간구분</small><strong>포항시 <span>›</span> {info.plan_region} <span>›</span> {info.plan_neighborhood_reference} 근린생활권</strong><p>선택한 행정구역: {info.adm_nm}</p></div>
    <div className="journey-plan-card"><small>계획서 표 4-13 · 근린생활권 주 기능</small><h3>{role ?? '연결된 계획 기능 추가 확인 필요'}</h3><p>{regionalDirections[info.plan_region] ?? '지역생활권별 개발 방향을 확인 중이야.'}</p></div>
    {info.plan_join_caution && <p className="journey-warning">경계 연결 주의: {info.plan_join_caution}. 계획상 근린생활권 경계와 현재 행정동 전체가 일치하지 않을 수 있어.</p>}
    {regionPlan && <div className="journey-plan-figure"><small>2030년 계획 · 상위 {info.plan_region} 기준</small><strong>공원 {regionPlan.count}개소 · {regionPlan.area}㎢</strong><p>이 수치는 {info.adm_nm}의 공원 목표가 아니야. 2030 계획의 군립공원 등을 포함한 생활권 단위 값이며, 현재 CSV 개소수와 달성률을 계산하지 않아.</p></div>}
    <div className="journey-subsection"><h3>이 동네와 연결된 사업 자료</h3>
      {related.length ? related.map((p: Project) => <div className="journey-related" key={p.id}>
        <strong>{p.name}</strong><small>{p.id === 'gokgang' ? '2030 기본계획 표 7-18에 등장하는 사업' : '위치를 기준으로 연결한 후속 고시 · 기본계획 내 동일 사업 여부 미확인'}</small>
        <button type="button" onClick={() => onSelect(p.id)}>사업 자료 자세히 보기 ›</button>
      </div>) : <p className="journey-empty">이 지역에 직접 연결해 검증한 개별 사업 자료가 아직 없어. 계획에 사업이 없다는 뜻은 아니야.</p>}
    </div>
    <p className="journey-source">출처: 「2030 포항 도시기본계획」 제4장 표 4-8(생활권 구분, 원문 PDF 118쪽), 표 4-13(생활권 개발전략, 125~126쪽), 제10장 표 10-22(공원계획, 445쪽). 계획 수립 당시 내용이므로 현재 확정·완료 상태가 아님.</p>
  </section>
}

export function ChangeStep({ code, projectIds, townName }: { code: string; projectIds: string[]; townName: string }) {
  const related = projects.projects.filter(p => projectIds.includes(p.id))
  const recordList = useMemo(() => events.filter(e => projectIds.includes(e.projectId)).slice().sort((a,b) => a.date.localeCompare(b.date)), [projectIds])
  return <section className="journey-content" aria-label="실제 변화와 추진 기록">
    <div className="journey-heading"><small>STEP 3 · 실제 변화와 확인된 기록</small><h2>실제로 무엇이 달라졌을까?</h2><p>동네의 인구·가구·주택 통계와 사업의 공식 고시 이력을 나란히 살펴봐.</p></div>
    <TownData code={code} mode="changes" />
    <div className="journey-subsection"><h3>관련 사업의 공식 고시 이력</h3>
      {recordList.length ? <ol className="journey-timeline">{recordList.map(e => <li key={e.projectId + e.date + e.url}><time dateTime={e.date}>{e.date}</time><strong>{related.find(p=>p.id===e.projectId)?.name ?? e.projectId}</strong><span>{e.title}</span><a href={e.url} target="_blank" rel="noreferrer">{e.source} · 고시 원문 ↗</a></li>)}</ol> : <p className="journey-empty">현재 {townName}에 연결해 검증한 사업 고시 이력이 없어. 사업 자체가 없거나 진행되지 않았다는 뜻은 아니야.</p>}
    </div>
    {related.length > 0 && <div className="journey-subsection"><h3>최근 확인된 문서상 상태</h3>{related.map(p => <div className="journey-related" key={p.id}><strong>{p.name}</strong><small>{p.status} · {p.source}</small><a href={p.url} target="_blank" rel="noreferrer">관련 고시 보기 ↗</a></div>)}</div>}
    <p className="journey-warning">통계의 증감과 사업 고시는 서로 다른 증거야. 고시가 있다고 공사·시설 개방이 완료된 것은 아니며, 인구 변화의 원인도 여기서 단정할 수 없어.</p>
  </section>
}

export function VoiceStep({ code, townName }: { code: string; townName: string }) {
  return <section className="journey-content" aria-label="시민 경험과 개선 의견">
    <div className="journey-heading"><small>STEP 4 · 시민의 경험과 제안</small><h2>나는 어떻게 생각할까?</h2><p>지도와 계획을 살펴봤다면, {townName}에서의 경험과 바라는 변화를 짧게 정리해봐.</p></div>
    <Feedback id={'town:' + code} townName={townName}/>
    <p className="journey-source">이 기능은 학생 프로젝트의 로컬 메모 시안이야. 아직 공개 의견 수집이나 시청 민원 접수, 정책 제안 전달 기능은 연결되지 않았어.</p>
  </section>
}
