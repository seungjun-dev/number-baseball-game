import { Eyebrow } from '../../../components'
import { ModeCard } from './ModeCard'

export function HomeScreen({ onStartSingle }: { onStartSingle: () => void }) {
  return (
    <section className="home-screen">
      <Eyebrow>YOUR CLUBHOUSE / 01</Eyebrow>
      <h1>
        오늘의 라인업은
        <br />
        <em>어떻게 갈까요?</em>
      </h1>
      <div className="mode-cards single">
        <ModeCard
          index="01 — SOLO"
          emoji="⚾"
          title="싱글 플레이"
          description="혼자 기록을 깨는 연습 경기"
          cta="START GAME ↗"
          onSelect={onStartSingle}
        />
      </div>
      <div className="tip-line">✦ &nbsp; 숫자는 중복 없이 네 개를 골라주세요.</div>
    </section>
  )
}
