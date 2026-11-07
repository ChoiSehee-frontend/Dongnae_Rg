import { TownWorkspace } from './TownWorkspace'
import {useEffect,useState} from 'react'
import {GeoJSON,useMap} from 'react-leaflet'
import L from 'leaflet'
import type {FeatureCollection,MultiPolygon} from 'geojson'
import raw from './data/pohang-towns.geojson?raw'
const geo=JSON.parse(raw) as FeatureCollection<MultiPolygon,{adm_nm:string;adm_cd2:string;sggnm:string}>
export const towns=geo.features.map(f=>({id:f.properties.adm_cd2,name:f.properties.adm_nm.split(' ').pop()!,gu:f.properties.sggnm.replace('포항시','')}))
const aliases:Record<string,string[]>={'흥해읍':['곡강리','남송리','한동대','한동대학교','곡강지구','흥해시장','포은흥해도서관'],'동해면':['임곡리','임곡지구'],'대이동':['이동','대잠동','이동지구'],'효곡동':['효자동','지곡동'],'장량동':['장성동','양덕동'],'환여동':['환호동','여남동']}
const plans:Record<string,string>={gokgang:'흥해읍',imgok:'동해면',idong:'대이동'}
export const townForProject=(id:string)=>towns.find(t=>t.name===plans[id])
export const credit=<span>읍·면·행정동 경계 2026.10.01 · SGIS(공공누리 1유형) / <a href="https://github.com/vuski/admdongkor/tree/master/ver20261001">vuski/admdongkor</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> · 포항 추출</span>
// GeoJSON coordinates are [longitude, latitude]; exclude polygon holes.
export function locateTown(lon:number,lat:number){
 function inside(r:number[][]){
   let hit=false
   for(let i=0,j=r.length-1;i<r.length;j=i++){
     const [x,y]=r[i]!,[a,b]=r[j]!
     if((y!>lat)!==(b!>lat) && lon<(a!-x!)*(lat-y!)/(b!-y!)+x!)hit=!hit
   }
   return hit
 }
 return geo.features.find(f=>f.geometry.coordinates.some(poly=>inside(poly[0]!)&&!poly.slice(1).some(inside)))?.properties.adm_cd2
}
export function LocateButton({onLocate}:{onLocate:(point:[number,number])=>void}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('')
 function locate(){
   if(!navigator.geolocation){setMessage('위치를 확인할 수 없어요. 아래에서 동네를 검색해 주세요.');return}
   setBusy(true);setMessage('위치를 확인하고 있어요.')
   navigator.geolocation.getCurrentPosition(({coords})=>{
     setBusy(false)
     onLocate([coords.latitude,coords.longitude]);setMessage('지도를 내 위치로 이동했어요.')

   },e=>{setBusy(false);setMessage(e.code===1?'위치 권한이 꺼져 있어요. 동네 이름으로도 찾을 수 있어요.':'위치를 확인하지 못했어요. 다시 시도하거나 동네를 검색해 주세요.')},{enableHighAccuracy:true,timeout:10000,maximumAge:60000})
 }
 return <><button className="pohang-button" disabled={busy} onClick={locate}>{busy?'위치 확인 중…':'현위치 찾기'}</button><small role="status">{message}</small></>
}
export function TownLayer(){
 const map=useMap()
 useEffect(()=>{map.fitBounds(L.geoJSON(geo).getBounds(),{padding:[10,10]})},[map])
 return <GeoJSON data={geo} style={{color:'#217563',weight:1.7,fillOpacity:.12}} onEachFeature={(f,l)=>{l.bindTooltip(String(f.properties.adm_nm.split(' ').pop()));l.on('click',()=>location.hash='town/'+f.properties.adm_cd2)}}/>
}
export function TownPicker({compact=false}:{compact?:boolean}){
 const [q,setQ]=useState('');const key=q.trim()
 const matches=towns.filter(t=>[t.name,t.gu,...aliases[t.name]??[]].some(v=>v.includes(key)))
 return <section className="town-picker"><label>포항 동네 찾기<input type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="예: 흥해읍, 곡강리, 한동대"/></label>{(!compact||key)&&<>{['북구','남구'].map(gu=>{const group=matches.filter(t=>t.gu===gu);return group.length>0&&<div key={gu}><small>{gu}</small><div>{group.map(t=><a key={t.id} href={'#town/'+t.id}>{t.name}{key && aliases[t.name]?.find(v=>v===key) && ' · '+key}</a>)}</div></div>})}{!matches.length&&<p>일치하는 동네가 없어요. 읍·면·동 이름으로 다시 찾아보세요.</p>}</>}</section>
}
export function TownHome({id}:{id:string}){
 const town=towns.find(t=>t.id===id)
 useEffect(()=>{window.scrollTo(0,0)},[id])
 const boundary=geo.features.find(f=>f.properties.adm_cd2===id)
 if(!town || !boundary)return <main className="story"><a href="#pohang">포항 지도에서 다시 선택</a></main>
 return <TownWorkspace town={town} boundary={boundary} plans={plans} attribution={credit}/>
}
