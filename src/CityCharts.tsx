import { towns } from './Towns'

const journey = [
  {n:'01',title:'우리 동네는 지금?',description:'생활시설·공원·지역 현황을 지도에서 확인합니다.'},
  {n:'02',title:'어떻게 계획됐을까?',description:'2030 도시기본계획과 주요 개발지구를 살펴봅니다.'},
  {n:'03',title:'무엇이 달라졌을까?',description:'확인된 통계 변화와 사업별 기록을 구분합니다.'},
  {n:'04',title:'나는 어떻게 생각할까?',description:'일상에서 느낀 변화와 개선 의견을 정리합니다.'},
]

export function CityCharts(){
 const heunghae=towns.find(t=>t.name==='흥해읍')
 return <section className="home-guide" aria-labelledby="home-guide-title">
  <header className="home-guide-heading">
   <div><small>HOW TO EXPLORE</small><h3 id="home-guide-title">우리 동네를 알아보는 네 가지 방법</h3><p>낯선 도시계획을 주민의 생활과 연결합니다. 현재 모습에서 계획, 실제 변화, 주민 의견까지 순서대로 살펴보세요.</p></div>
   <span>동네 알기 · 포항 시범 서비스</span>
  </header>
  <div className="home-guide-steps">
   {journey.map(step=><div className="home-guide-step" key={step.n}><span className="home-guide-number">{step.n}</span><strong>{step.title}</strong><p>{step.description}</p></div>)}
  </div>
  <div className="home-guide-feature">
   <div><small>집중 탐색 지역 · 포항시 북구</small><h4>흥해읍의 도시계획을 지도와 함께</h4><p>성곡·이인·초곡·남옥·곡강 5개 개발지구를 선택해 계획과 확인된 사업 내용을 살펴볼 수 있습니다.</p></div>
   {heunghae&&<a href={'#town/'+heunghae.id}>흥해읍 살펴보기 <span aria-hidden="true">→</span></a>}
  </div>
  <p className="home-guide-note">계획서의 목표, 통계의 관측값, 고시의 행정 기록은 각각 다른 정보입니다. 이 서비스에서는 자료의 출처와 기준을 구분해 표시합니다.</p>
 </section>
}
