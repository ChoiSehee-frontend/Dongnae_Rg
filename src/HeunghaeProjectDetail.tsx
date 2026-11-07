import plan from './data/heunghae-plan-v13.json'
import notice from './data/gokgang-notice-v12.json'

const fmt = (n: number) => n.toLocaleString('ko-KR')
type District = (typeof plan.projects)[number]

function Fact({ title, value, note }: { title: string; value: string; note?: string }) {
  return <div className="district-fact"><span>{title}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>
}

/** Single compact detail page for each of the five 2030-plan development districts. */
export function HeunghaeProjectDetail({ projectId }: { projectId: string }) {
  const project: District | undefined = plan.projects.find(p => p.id === projectId)
  if (!project) return <p className="journey-empty">해당 지구의 계획자료가 없습니다.</p>
  const gokgang = projectId === 'gokgang'
  const area = gokgang ? notice.landUse2024.total : project.planArea
  return <article className="district-detail" aria-label={`${project.name} 사업 상세`}>
    <header className="district-head">
      <small>흥해읍 / 도시개발사업 · {gokgang ? '2026년 고시 반영' : '기본계획 수록 자료'}</small>
      <h2>{project.name} 도시개발사업</h2>
      <p>{project.summary}</p>
    </header>
    <div className="district-facts">
      <Fact title="위치" value={project.place + ' 일원'} />
      <Fact title={gokgang ? '2026년 고시상 면적' : '도시기본계획 수록 면적'} value={`${fmt(area)}㎡`} note={gokgang ? '변경 인가된 사업구역' : '당시 계획서 기준'} />
      <Fact title={gokgang ? '계획 수용 주택' : '계획서에 적힌 기간'} value={gokgang ? `${fmt(notice.landUse2024.plannedHouseholds)}호` : project.planPeriod} note={gokgang ? '실제 준공·입주 수치 아님' : '현재 공사 일정이 아님'} />
      <Fact title={gokgang ? '인가된 사업기간 종료일' : '확인된 후속 고시'} value={gokgang ? '2027.12.31' : (project.notice?.date ?? '확인 중')} note={gokgang ? '실제 준공일과 구분' : (project.notice?.number ?? '')} />
    </div>
    {gokgang ? <>
      <section className="district-section">
        <h3>계획된 생활시설</h3>
        <div className="district-facilities"><span>어린이공원 <b>4곳</b></span><span>초등학교 부지 <b>1곳</b></span><span>주차장 <b>2곳</b></span><span>도로 <b>32개 노선</b></span><span>완충녹지 <b>5곳</b></span></div>
        <p className="district-muted">2024년 제320호 고시의 설치계획. 실제 개방·운영 여부는 별도 확인 필요.</p>
      </section>
      <section className="district-section">
        <h3>무엇이 변경됐을까?</h3>
        <div className="district-history"><time dateTime="2024-09-11">2024.09</time><p>현장 여건에 따른 공사계획·사업비 조정. <strong>주택·공원·도로 등 토지이용계획은 유지.</strong></p></div>
        <div className="district-history"><time dateTime="2026-01-28">2026.01</time><p>사업기간 종료 예정일 <strong>2025.12.31 → 2027.12.31</strong>로 2년 연장. 사업구역 면적은 유지.</p></div>
      </section>
      <details className="district-more"><summary>상세 계획과 건축 기준</summary>
        <dl><dt>주거용지</dt><dd>{fmt(notice.landUse2024.residential)}㎡ (60.2%)</dd><dt>공공시설용지</dt><dd>{fmt(notice.landUse2024.publicFacility)}㎡ (39.8%)</dd><dt>공동주택 계획</dt><dd>일반 구간 최고 25층, 한동대 인접 30m 구간 12층 이하</dd><dt>주변 경관</dt><dd>한동대에서 북측 산림을 바라보는 폭 20m 이상 통경축 계획</dd></dl>
      </details>
    </> : <section className="district-section">
      <h3>확인된 사업 기록</h3>
      {project.notice ? <div className="district-history"><time dateTime={project.notice.date}>{project.notice.date.slice(0,7).replace('-', '.')}</time><p><strong>{project.notice.title}</strong><span className="district-muted"> · {project.notice.number}</span></p></div> : <p className="district-muted">개별 고시 내용을 확인 중입니다.</p>}
      <p className="district-muted">이 고시의 존재와 종류를 확인한 단계입니다. 구체적인 시설 변경 내역과 현재 공사·준공 상태는 추가 검증 중입니다.</p>
    </section>}
    <details className="district-references"><summary>자료 출처</summary>
      <p>「2030 포항 도시기본계획」 제7장 표 7-18 · PDF 277쪽 (계획 수립 당시 자료)</p>
      {gokgang ? <><p>포항시 2024-320호(개발계획·실시계획 변경인가), 포항시 2026-28호(사업기간 변경)</p><p><a href={notice.notices['2024'].url} target="_blank" rel="noreferrer">2024년 고시 원문 ↗</a> · <a href={notice.notices['2026'].url} target="_blank" rel="noreferrer">2026년 고시 원문 ↗</a></p></>
      : project.notice && <p><a href={project.notice.url} target="_blank" rel="noreferrer">{project.notice.number} 고시 원문 ↗</a></p>}
    </details>
  </article>
}
