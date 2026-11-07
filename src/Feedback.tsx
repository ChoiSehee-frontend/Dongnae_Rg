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

function readSavedNote(key: string, fallbackTown: string): Note | null {
  try {
    if (!localStorage.getItem(key)) return null
    return readNote(key, fallbackTown)
  } catch {
    return null
  }
}

export function Feedback({ id, townName = '' }: { id: string; townName?: string }) {
  const key = 'dongnae:draft:' + id
  const [note, setNote] = useState<Note>(() => readNote(key, townName))
  const [savedNote, setSavedNote] = useState<Note | null>(() => readSavedNote(key, townName))
  const [message, setMessage] = useState('')
  const update = (field: keyof Note, value: string) => { setNote(old => ({ ...old, [field]: value })); setMessage('') }

  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!note.place.trim() || !note.experience.trim() || !note.proposal.trim()) {
      setMessage('장소·경험·제안 세 항목을 입력해 주세요.')
      return
    }
    try { localStorage.setItem(key, JSON.stringify(note)); setSavedNote({ ...note }); setMessage('') }
    catch { setMessage('메모를 저장할 수 없습니다.') }
  }
  function erase() {
    try { localStorage.removeItem(key); setNote({ ...emptyNote, place: townName }); setSavedNote(null); setMessage('메모를 삭제했습니다.') }
    catch { setMessage('메모를 삭제할 수 없습니다.') }
  }

  return <>
    <form className="voice-form" onSubmit={save}>
      <label>어느 장소인가요? <span>필수</span>
        <input value={note.place} onChange={e => update('place', e.target.value)} maxLength={100} placeholder="예: 흥해읍 곡강리, 공원 앞 보도 위치를 적어 주세요." />
      </label>
      <label>이곳에서 어떤 경험을 했나요? <span>필수</span>
        <textarea value={note.experience} onChange={e => update('experience', e.target.value)} maxLength={600} rows={4} placeholder="이용 시간, 불편했던 점, 좋았던 점 등을 적어 주세요." />
      </label>
      <label>어떤 변화를 제안하고 싶나요? <span>필수</span>
        <textarea value={note.proposal} onChange={e => update('proposal', e.target.value)} maxLength={600} rows={4} placeholder="바라는 개선 사항을 구체적으로 적어 주세요." />
      </label>
      <label>함께 고려해야 할 사람이나 상황이 있나요? <span>선택</span>
        <textarea value={note.others} onChange={e => update('others', e.target.value)} maxLength={300} rows={2} placeholder="예: 보행자, 가게 배송 차량, 어린이 등 고려할 상황을 적어 주세요." />
      </label>
      <div className="voice-actions"><button type="submit">메모 저장</button><button type="button" onClick={erase}>메모 삭제</button></div>
      <small role="status">{message}</small>
      <p className="voice-storage-note">저장한 메모는 지자체에 반영되지 않으며, 이 브라우저에만 저장됩니다.</p>
    </form>
    {savedNote && <section className="voice-saved-note" aria-label="저장한 메모" aria-live="polite">
      <div className="voice-saved-heading"><h3>저장한 메모</h3></div>
      <dl>
        <dt>장소</dt><dd>{savedNote.place}</dd>
        <dt>경험</dt><dd>{savedNote.experience}</dd>
        <dt>제안</dt><dd>{savedNote.proposal}</dd>
        {savedNote.others && <><dt>함께 고려할 점</dt><dd>{savedNote.others}</dd></>}
      </dl>
    </section>}
  </>
}
