import metrics from './data/town-metrics.json'

type TownMetric = (typeof metrics)[number]
const sgisUrl = 'https://sgis.mods.go.kr/'
const parkUrl = 'https://www.data.go.kr/data/15012890/standard.do'
const format = (n: number) => n.toLocaleString('ko-KR')

const cityCount = metrics.length
const citySums = metrics.reduce((acc, item) => ({
  population: acc.population + item.population_2024,
  households: acc.households + item.households_2024,
  housing: acc.housing + item.housing_2024,
  parks: acc.parks + item.parks_count_2026,
}), { population: 0, households: 0, housing: 0, parks: 0 })

function CityBenchmark({ value, average, unit }: { value: number; average: number; unit: string }) {
  const range = Math.max(value, average, 1)
  const multiple = value / Math.max(average, 1)
  return <div className="td-reference">
    <span>포항시 읍·면·동 평균 <b>{format(Math.round(average))}{unit}</b></span>
    <span className="td-reference-multiple">평균의 {multiple.toFixed(1)}배</span>
    <div className="td-reference-track" aria-hidden="true">
      <b style={{ width: `${value / range * 100}%` }} />
      <i style={{ left: `${average / range * 100}%` }} />
    </div>
  </div>
}

function MetricRow({ title, oldValue, newValue, unit }: {
  title: string
  oldValue: number
  newValue: number
  unit: string
}) {
  const diff = newValue - oldValue
  const maxValue = Math.max(oldValue, newValue, 1)
  return <div className="td-metric">
    <h4>{title}<strong>{diff > 0 ? '+' : ''}{format(diff)}{unit}</strong></h4>
    <div className="td-chartline"><span>2023</span><div><b style={{ width: `${oldValue / maxValue * 100}%` }}/></div><em>{format(oldValue)}</em></div>
    <div className="td-chartline"><span>2024</span><div><b style={{ width: `${newValue / maxValue * 100}%` }}/></div><em>{format(newValue)}</em></div>
  </div>
}

export function TownData({ code, mode = 'snapshot' }: { code: string; mode?: 'snapshot' | 'changes' }) {
  const info = (metrics as TownMetric[]).find(m => m.adm_cd === code)
  if (!info) return <section className="td-board"><p>해당 동네의 통계 연결을 확인하지 못했습니다.</p></section>

  if (mode === 'changes') return <section className="td-board" aria-label="동네별 인구·가구·주택 변화">
    <div className="td-head">
      <small>SGIS 공식 통계 · 2023년 → 2024년</small>
      <h2>{info.adm_nm}의 변화</h2>
      <p>동일한 SGIS 행정코드의 2023년과 2024년 집계. 두 시점만으로 장기 추세나 변화 원인을 판단할 수 없습니다.</p>
    </div>
    <MetricRow title="인구" oldValue={info.population_2023} newValue={info.population_2024} unit="명" />
    <MetricRow title="가구" oldValue={info.households_2023} newValue={info.households_2024} unit="가구" />
    <MetricRow title="주택·거처 집계" oldValue={info.housing_2023} newValue={info.housing_2024} unit="" />
    <p className="td-caution">※ SGIS 인구총조사와 주민등록인구는 집계 기준이 다릅니다. 통계 변화를 특정 도시개발사업의 실적으로 해석할 수 없습니다.</p>
    <small className="td-source">출처: <a href={sgisUrl} target="_blank" rel="noreferrer">SGIS 인구·가구·주택 통계</a> · 2023/2024.</small>
  </section>

  return <section className="td-board" aria-label="동네별 현재 확보된 공식 통계">
    <div className="td-head">
      <small>STEP 1 · 확인된 동네 현황</small>
      <h2>{info.adm_nm}의 지금 모습</h2>
      <p>2024년 SGIS 행정구역별 통계 · 포항시 {cityCount}개 읍·면·동의 단순 평균과 비교</p>
    </div>
    <div className="td-snapshot">
      <div><small>인구 · 2024</small><strong>{format(info.population_2024)}<em>명</em></strong><CityBenchmark value={info.population_2024} average={citySums.population / cityCount} unit="명" /></div>
      <div><small>가구 · 2024</small><strong>{format(info.households_2024)}<em>가구</em></strong><CityBenchmark value={info.households_2024} average={citySums.households / cityCount} unit="가구" /></div>
      <div><small>주택·거처 · 2024</small><strong>{format(info.housing_2024)}<em>개</em></strong><CityBenchmark value={info.housing_2024} average={citySums.housing / cityCount} unit="개" /></div>
    </div>
    <p className="td-reference-note">작은 막대는 선택 지역, 세로선은 포항시 읍·면·동 평균을 나타냅니다. 행정구역별 면적·규모가 달라 생활 수준이나 시설 충족률의 순위는 아닙니다.</p>
    <div className="td-parks"><strong>위치가 확인된 공원 {format(info.parks_count_2026)}개</strong>
      <span>포항시 공원 CSV 수록 {format(citySums.parks)}개 중 {(info.parks_count_2026 / citySums.parks * 100).toFixed(1)}% · 선택 지역 면적 합계 {format(Math.round(info.parks_area_m2_2026))}㎡. CSV 수록 범위에 따른 비중으로, 실제 전체 공원 중 비중은 아닙니다.</span>
    </div>
    <small className="td-source">자료: <a href={sgisUrl} target="_blank" rel="noreferrer">SGIS</a> 2024년 행정구역별 통계 · <a href={parkUrl} target="_blank" rel="noreferrer">공공데이터포털 공원 CSV</a> (2026-05-12). 주택·거처 수는 공식 주택보급률과 다른 지표입니다.</small>
  </section>
}
