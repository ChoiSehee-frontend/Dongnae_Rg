import data from './data/city-series.json'
export function CityCharts(){
 const points=data.population.points
 const xy=points.map(([year,count])=>[46+(year!-2014)*24,106-(count!-490000)*.0028])
 return <><div className="indicator-card"><strong>포항 주민등록인구 추이</strong><svg viewBox="0 0 272 134" role="img" aria-label="2014년 519,368명에서 2023년 493,033명으로 감소"><text x="0" y="25" fontSize="10">52만 명</text><text x="0" y="109" fontSize="10">49만 명</text><path d="M46 22V106H262" fill="none" stroke="#aaa"/><polyline points={xy.map(p=>p.join(',')).join(' ')} fill="none" stroke="#237967" strokeWidth="2"/>{xy.map(([x,y],i)=><circle key={i} cx={x} cy={y} r="3" fill="#237967"><title>{points[i]!.join('년 · ')}명</title></circle>)}<text x="46" y="126" fontSize="11">2014</text><text x="238" y="126" fontSize="11">2023</text></svg><details><summary>연도별 값과 출처</summary>{points.map(([y,v])=><div key={y}>{y}년 · {v?.toLocaleString()}명</div>)}<a href={data.population.source}>원문 표 3-9</a></details></div></>
}
