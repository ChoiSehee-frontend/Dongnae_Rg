import {Facts,gokgangFacts} from './Facts'
import {townForProject} from './Towns'
import { useEffect, useRef } from 'react'
import stories from './data/stories.json'
import events from './data/events.json'
export function ProjectStory({project}:{project:{id:string;name:string}}){
 const story=stories[project.id as keyof typeof stories]
 const heading=useRef<HTMLHeadingElement>(null)
 useEffect(()=>{heading.current?.focus();window.scrollTo(0,0)},[project.id])
 if(!story)return <main><a href="#pohang">포항 지도로</a><p>사업 설명을 준비하고 있어요.</p></main>
 const records=events.filter(e=>e.projectId===project.id)
 return <main className="story"><nav><a href={'#town/'+townForProject(project.id)?.id}>← {townForProject(project.id)?.name} 소식</a> · <a href="#pohang">포항 지도</a></nav><header><small>동네알기 · 포항 사업 이야기</small><h1 tabIndex={-1} ref={heading}>{project.name}</h1><span>{story.place}</span><p>{story.lead}</p></header>
 {project.id==='gokgang'?<><section><h2>공간 계획</h2><Facts rows={gokgangFacts.slice(0,4)}/></section><section><h2>계획과 현장</h2><Facts rows={[...gokgangFacts.slice(4),['기한의 의미','사업 시행기간의 종료 예정일 · 입주·개통 확정일 아님'],['도시기본계획과의 관계','사업 고시에 도시기본계획 실현 목적 명시 · 목표 달성 여부 미평가']]}/></section></>:story.sections.map(([q,a,source])=><section key={q}><h2>{q}</h2><p>{a}</p><small>근거 · {source}</small></section>)}
 {project.id!=='gokgang'&&<aside><h2>지금 현장에서는요?</h2><p>{story.field}</p></aside>}
 <details><summary>근거 자료와 고시 기록 보기 ({records.length}건)</summary><ul>{records.map(e=><li key={e.url}><time>{e.date}</time> · {e.title} <a href={e.url} target="_blank" rel="noreferrer">{e.source} 원문 ↗</a></li>)}</ul></details></main>
}
