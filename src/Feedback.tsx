import { useState, type FormEvent } from 'react'

type Note = { place: string; experience: string; proposal: string; others: string }
const emptyNote: Note = { place: '', experience: '', proposal: '', others: '' }

function readNote(key: string, fallbackTown: string): Note {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return { ...emptyNote, place: fallbackTown }
    const parsed: unknown = JSON.parse(saved)
    if (parsed && typeof parsed === 'object') {
      const value = parsed as Partial<Note>
      return {
        place: typeof value.place === 'string' ? value.place : fallbackTown,
        experience: typeof value.experience === 'string' ? value.experience : '',
        proposal: typeof value.proposal === 'string' ? value.proposal : '',
        others: typeof value.others === 'string' ? value.others : '',
      }
    }
    return { ...emptyNote, place: fallbackTown }
  } catch {
    // Earlier versions saved a single free-text note instead of JSON.
    try { return { ...emptyNote, place: fallbackTown, experience: localStorage.getItem(key) ?? '' } }
    catch { return { ...emptyNote, place: fallbackTown } }
  }
}

export function Feedback({ id, townName = '' }: { id: string; townName?: string }) {
  const key = 'dongnae:draft:' + id
  const [note, setNote] = useState<Note>(() => readNote(key, townName))
  const [message, setMessage] = useState('')
  const update = (field: keyof Note, value: string) => { setNote(old => ({ ...old, [field]: value })); setMessage('') }

  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!note.place.trim() || !note.experience.trim() || !note.proposal.trim()) {
      setMessage('장소·경험·제안 세 항목을 입력해줘.')
      return
    }
    try { localStorage.setItem(key, JSON.stringify(note)); setMessage('이 기기에만 메모를 저장했어.') }
    catch { setMessage('이 기기에서는 메모를 저장할 수 없어.') }
  }
  function erase() {
    try { localStorage.removeItem(key); setNote({ ...emptyNote, place: townName }); setMessage('이 기기에 저장된 메모를 삭제했어.') }
    catch { setMessage('메모를 삭제할 수 없어.') }
  }

  return <form className="voice-form" onSubmit={save}>
    <label>어느 장소인가요? <span>필수</span>
      <input value={note.place} onChange={e => update('place', e.target.value)} maxLength={100} placeholder="예: 흥해읍 곡강리, 공원 앞 보도" />
    </label>
    <label>이곳에서 어떤 경험을 했나요? <span>필수</span>
      <textarea value={note.experience} onChange={e => update('experience', e.target.value)} maxLength={600} rows={4} placeholder="이용 시간, 불편했던 점, 좋았던 점 등을 적어줘." />
    </label>
    <label>어떤 변화를 제안하고 싶나요? <span>필수</span>
      <textarea value={note.proposal} onChange={e => update('proposal', e.target.value)} maxLength={600} rows={4} placeholder="바라는 개선 사항을 구체적으로 적어줘." />
    </label>
    <label>함께 고려해야 할 사람이나 상황이 있나요? <span>선택</span>
      <textarea value={note.others} onChange={e => update('others', e.target.value)} maxLength={300} rows={2} placeholder="예: 보행자, 가게 배송 차량, 어린이 등" />
    </label>
    <div className="voice-actions"><button type="submit">내 기기에 메모 저장</button><button type="button" onClick={erase}>메모 삭제</button></div>
    <small role="status">{message}</small>
    <p className="voice-privacy">이름·연락처를 입력할 필요가 없어. 입력 내용은 현재 브라우저의 로컬 저장소에만 남고 서버·다른 사용자·지자체에 전송되지 않아.</p>
  </form>
}
