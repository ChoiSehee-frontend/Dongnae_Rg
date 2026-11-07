import metrics from './data/town-metrics.json'

type TownMetric = (typeof metrics)[number]
const sgisUrl = 'https://sgis.mods.go.kr/'
const parkUrl = 'https://www.data.go.kr/data/15012890/standard.do'
const format = (n: number) => n.toLocaleString('ko-KR')

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
      <p>같은 SGIS 행정코드로 두 연도를 연결한 변화야. 두 시점만으로 장기 추세나 변화 원인을 판단할 수는 없어.</p>
    </div>
    <MetricRow title="인구" oldValue={info.population_2023} newValue={info.population_2024} unit="명" />
    <MetricRow title="가구" oldValue={info.households_2023} newValue={info.households_2024} unit="가구" />
    <MetricRow title="주택·거처 집계" oldValue={info.housing_2023} newValue={info.housing_2024} unit="" />
    <p className="td-caution">※ SGIS 인구총조사와 주민등록인구는 통계 기준이 달라. 이 그래프를 특정 도시개발사업의 성과로 해석하지 않아.</p>
    <small className="td-source">출처: <a href={sgisUrl} target="_blank" rel="noreferrer">SGIS 인구·가구·주택 통계</a> · 2023/2024.</small>
  </section>

  return <section className="td-board" aria-label="동네별 현재 확보된 공식 통계">
    <div className="td-head">
      <small>STEP 1 · 확인된 동네 현황</small>
      <h2>{info.adm_nm}의 지금 모습</h2>
      <p>가장 최근 확보한 읍·면·동 통계는 2024년, 위치가 있는 공원 목록은 2026년 5월 기준이야.</p>
    </div>
    <div className="td-snapshot">
      <div><small>인구 · 2024</small><strong>{format(info.population_2024)}<em>명</em></strong></div>
      <div><small>가구 · 2024</small><strong>{format(info.households_2024)}<em>가구</em></strong></div>
      <div><small>주택·거처 · 2024</small><strong>{format(info.housing_2024)}<em>개</em></strong></div>
    </div>
    <div className="td-parks"><strong>위치가 확인된 공원 {format(info.parks_count_2026)}개</strong>
      <span>CSV에 수록된 면적 합계 {format(Math.round(info.parks_area_m2_2026))}㎡. 목록이 없거나 적더라도 그 동네에 공원이 없다는 의미는 아니야.</span>
    </div>
    <small className="td-source">자료: <a href={sgisUrl} target="_blank" rel="noreferrer">SGIS</a> 2024년 행정구역별 통계 · <a href={parkUrl} target="_blank" rel="noreferrer">공공데이터포털 공원 CSV</a> (2026-05-12). 주택·거처 수는 공식 주택보급률이 아니야.</small>
  </section>
}
