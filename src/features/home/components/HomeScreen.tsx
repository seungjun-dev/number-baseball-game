import { Eyebrow } from '../../../components'
import { ModeCard } from './ModeCard'

type Props = {
  onStartSingle: () => void
  /** 서버 연결 시에만 전달 → 1:1 대전 카드 노출 */
  onStartVersus?: () => void
}

export function HomeScreen({ onStartSingle, onStartVersus }: Props) {
  return (
    <section className="home-screen">
      <Eyebrow>YOUR CLUBHOUSE / 01</Eyebrow>
      <h1>
        오늘의 라인업은
        <br />
        <em>어떻게 갈까요?</em>
      </h1>
      <div className={`mode-cards${onStartVersus ? '' : ' single'}`}>
        <ModeCard
          index="01 — SOLO"
          emoji="⚾"
          title="싱글 플레이"
          description="혼자 기록을 깨는 연습 경기"
          cta="START GAME ↗"
          onSelect={onStartSingle}
        />
        {onStartVersus && (
          <ModeCard
            index="02 — VERSUS"
            emoji="🏆"
            title="1:1 대전"
            description="친구 또는 랜덤 상대와 실시간 승부"
            cta="FIND MATCH ↗"
            onSelect={onStartVersus}
          />
        )}
      </div>
      <div className="tip-line">✦ &nbsp; 숫자는 중복 없이 네 개를 골라주세요.</div>
    </section>
  )
}
