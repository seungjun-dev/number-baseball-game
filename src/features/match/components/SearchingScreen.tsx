import { PrimaryButton, TextButton } from '../../../components'
import { useNow } from '../../../hooks/useNow'
import { formatClock } from '../logic/matchView'

/** 이 시간이 지나도 상대가 없으면 초대 코드를 권한다 */
export const SUGGEST_INVITE_AFTER_SECONDS = 30

type Props = { startedAt: number; onCancel: () => void; onSwitchToInvite: () => void }

export function SearchingScreen({ startedAt, onCancel, onSwitchToInvite }: Props) {
  const elapsed = Math.max(0, Math.floor((useNow() - startedAt) / 1000))
  return (
    <section className="status-screen">
      <div className="search-ball" aria-hidden="true">
        ⚾
      </div>
      <h2>상대를 찾는 중…</h2>
      <p role="timer">{formatClock(elapsed)}</p>
      {elapsed >= SUGGEST_INVITE_AFTER_SECONDS && (
        <>
          <p>지금은 접속한 상대가 적어요. 친구를 초대해 볼까요?</p>
          <PrimaryButton onClick={onSwitchToInvite}>초대 코드 만들기</PrimaryButton>
        </>
      )}
      <TextButton onClick={onCancel}>매칭 취소</TextButton>
    </section>
  )
}
