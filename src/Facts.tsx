import { Fragment } from 'react'
export function Facts({rows}:{rows: [string,string][]}){
 return <dl className="fact-list">{rows.map(([label,value])=><Fragment key={label}><dt>{label}</dt><dd>{value}</dd></Fragment>)}</dl>
}
export const gokgangFacts: [string,string][]=[
 ['위치','북구 흥해읍 곡강리 산148-2 일대'],
 ['전체 면적','267,342㎡'],
 ['토지 이용','주택 부지 60.2% · 도로·학교·공원 등 공공시설 부지 39.8%'],
 ['생활시설 계획','학교 1곳 · 어린이공원 4곳 · 보행자도로 1,152㎡'],
 ['사업 기한 변경','2025.12.31 → 2027.12.31 (2년 연장)'],
 ['현장 확인','공원 개방일·보행로 통행 가능 여부·입주일 미확인']
]
