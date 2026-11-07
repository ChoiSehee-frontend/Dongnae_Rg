import plan from './data/heunghae-plan-v13.json'
import sgis from './data/sgis-population-2015-2024.json'

const fmt = (n: number) => n.toLocaleString('ko-KR')


// STEP 2: 먼저 흥해읍 전체의 계획을 소개한다. 개별 사업의 상세 내용은 여기서 중복 표시하지 않는다.
export function HeunghaePlan({ onSelect }: { onSelect: (id: string) => void }) {
  return <section className="journey-content gk-study" aria-label="흥해읍 도시기본계획과 주요 사업">
    <div className="journey-heading">
      <small>STEP 2 · 흥해읍의 도시계획</small>
      <h2>흥해읍에는 어떤 변화가 계획되었을까?</h2>
      <p>포항역 주변의 거점 형성, 주거지 개발, 영일만항 배후 산업기능을 중심으로 정리한 도시기본계획</p>
    </div>
    <small className="gk-inline-scope">2030 포항 도시기본계획 · 흥해 근린생활권 / 북부생활권</small>
    <div className="gk-town-strategies">
      <article className="gk-town-strategy">
        <span aria-hidden="true">01</span>
        <div><h3>포항역 주변을 북부권의 주요 거점으로</h3><p>흥해 지역을 포항역 주변 역세권 및 경제자유구역과 연계해 북부권의 부도심 거점으로 육성하는 방향을 제시했다. 역 주변 개발구역의 상세 시설은 별도의 사업계획으로 확인해야 한다.</p></div>
      </article>
      <article className="gk-town-strategy">
        <span aria-hidden="true">02</span>
        <div><h3>성곡·이인·초곡·남옥·곡강 일대 주거지 개발</h3><p>계획서에는 흥해읍의 여러 도시개발사업이 수록되어 있다. 각 지구는 위치와 규모가 다르며, 계획 당시 수치와 현재 인가된 규모는 구분해 확인한다.</p></div>
      </article>
      <article className="gk-town-strategy">
        <span aria-hidden="true">03</span>
        <div><h3>영일만항 주변에 산업·물류 기능을 연계</h3><p>포항영일신항만 조성과 항만 배후산업단지, 경제자유구역 추진을 통해 물류와 경제교류 기능을 강화하는 구상이 포함되어 있다.</p></div>
      </article>
    </div>
    <div className="gk-town-list-head"><h3>어느 지역에 어떤 사업이 계획됐을까?</h3><p>도시기본계획에 수록된 흥해읍의 주요 도시개발사업 5건. 면적은 계획서 수록 당시 기준. 각 지구를 선택하면 확인된 사업 기록을 볼 수 있다.</p></div>
    <div className="gk-town-projects">
      {plan.projects.map(item => <article key={item.id} className={'gk-town-project active'}>
        <div className="gk-town-project-top"><strong>{item.name} 도시개발사업</strong><small>{item.place}</small></div>
        <p>계획서 수록 면적 {fmt(item.planArea)}㎡</p>
        <button type="button" onClick={() => onSelect(item.id)} aria-label={`${item.name} 상세 보기`}>상세 보기 →</button>
      </article>)}
    </div>
    <p className="journey-source">자료: 「2030 포항 도시기본계획」 제4장 생활권 개발전략(원문 PDF 125쪽), 제7장 시가지 개발사업(원문 PDF 277쪽). 사업 목록은 발췌이며 현재 진행 상태를 나타내지 않음. 곡강지구의 최신 인가 내용은 상세 화면에서 별도 제공.</p>
  </section>
}

/** STEP 3 is a short Heunghae town overview, not a population-forecast dashboard. */
type PopulationPoint = { year: number; heunghae: number; north: number }
const populationYears: PopulationPoint[] = [...sgis.yearly].sort((a, b) => a.year - b.year)
const firstYear = populationYears.find(p => p.year === 2015)
const lastYear = populationYears.find(p => p.year === 2024)
const regionTarget = plan.regionPopulation.target2030

export function HeunghaeChanges({ onSelect }: { onSelect: (id: string) => void }) {
  const delta = firstYear && lastYear ? lastYear.heunghae - firstYear.heunghae : null
  const deltaPct = firstYear && delta !== null ? delta / firstYear.heunghae * 100 : null
  const northernRatio = lastYear ? lastYear.north / regionTarget * 100 : null

  return <section className="journey-content gk-study" aria-label="흥해읍의 변화와 확인된 사업 기록">
    <div className="journey-heading">
      <small>STEP 3 · 흥해읍의 변화</small>
      <h2>흥해읍에서는 무엇이 달라졌을까?</h2>
      <p>동네의 인구 변화와 주요 개발사업의 확인된 기록을 간단히 살펴봅니다.</p>
    </div>

    <section className="v134-section" aria-label="흥해읍 인구 변화">
      <div className="v134-section-head"><h3>인구로 살펴본 동네 변화</h3><small>SGIS · 2015년과 2024년</small></div>
      {firstYear && lastYear ? <>
        <div className="v134-pop-summary">
          <div><small>2015년</small><strong>{fmt(firstYear.heunghae)}명</strong></div>
          <span aria-hidden="true" className="v134-arrow">→</span>
          <div><small>2024년</small><strong>{fmt(lastYear.heunghae)}명</strong></div>
          <div className="v134-pop-change"><small>9년간 인구 증감</small><strong>{delta! > 0 ? '+' : ''}{fmt(delta!)}명 <em>({deltaPct! > 0 ? '+' : ''}{deltaPct!.toFixed(1)}%)</em></strong></div>
        </div>
        <p className="v134-caption">SGIS 행정구역별 총인구 기준. 동일 행정코드의 두 연도 비교이며 행정경계·집계 기준의 시점별 일치 여부는 별도 검증이 필요합니다.</p>
      </> : <p className="journey-empty">비교 가능한 2015·2024년 인구 자료를 확인 중입니다.</p>}
    </section>

    <section className="v134-section" aria-label="흥해읍 개발사업 기록">
      <div className="v134-section-head"><h3>개발사업은 어떻게 진행되고 있을까?</h3><small>공식 고시 기준</small></div>
      <p className="v134-intro">2030 도시기본계획에는 흥해읍의 주요 도시개발사업 5곳이 수록되어 있습니다. 이후 확인된 고시에서 다음과 같은 변경 기록을 확인할 수 있습니다.</p>
      <div className="v134-project-highlight">
        <div><span>곡강지구</span><strong>사업기간 종료 예정일 2년 연장</strong><p>2025.12.31 → 2027.12.31 · 2026년 실시계획 변경인가</p></div>
        <button type="button" onClick={() => onSelect('gokgang')}>상세 보기 →</button>
      </div>
      <div className="v134-project-highlight">
        <div><span>이인지구</span><strong>2026년 실시계획 변경인가 기록</strong><p>변경의 구체적인 시설·공사 내용은 추가 확인 대상</p></div>
        <button type="button" onClick={() => onSelect('iin')}>상세 보기 →</button>
      </div>
      <p className="v134-caption">변경인가 등 행정 기록은 공사 완료나 실제 시설 개방을 의미하지 않습니다. 성곡·초곡·남옥지구를 포함한 개별 계획과 기록은 STEP 2에서 각 지구를 선택해 볼 수 있습니다.</p>
    </section>

    <section className="v134-section v134-region" aria-label="북부생활권 인구 계획 참고">
      <div className="v134-section-head"><h3>2030 인구계획 참고</h3><small>흥해읍이 속한 북부생활권 전체</small></div>
      <div className="v134-target-values"><div><small>2024년 SGIS 집계</small><strong>{lastYear ? `${fmt(lastYear.north)}명` : '확인 중'}</strong></div><div><small>2030 도시기본계획 인구</small><strong>{fmt(regionTarget)}명</strong></div></div>
      <p className="v134-caption">단순 수치 비율 {northernRatio === null ? '확인 중' : `${northernRatio.toFixed(1)}%`} · 계획 인구는 흥해읍 단독 목표가 아닙니다. SGIS와 계획서의 집계 기준이 달라 공식 계획 달성률로 해석하지 않습니다.</p>
    </section>

    <p className="journey-source">인구: SGIS 행정구역별 총인구 2015·2024년. 계획: 「2030 포항 도시기본계획」 표 4-12 및 표 7-18. 사업 기록: 포항시 제2026-28호(곡강지구), 제2026-255호(이인지구) 고시.</p>
  </section>
}
