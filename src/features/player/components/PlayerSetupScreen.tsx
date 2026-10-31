import { Eyebrow } from '../../../components'
import type { ProfileInput } from '../api/playerRepository'
import { PlayerForm } from './PlayerForm'

/** 첫 실행 시 플레이어 만들기 (시안의 로그인 화면 레이아웃) */
export function PlayerSetupScreen({ onCreate }: { onCreate: (input: ProfileInput) => Promise<void> }) {
  return (
    <section className="entry-screen">
      <div className="entry-copy">
        <Eyebrow>NEW SEASON</Eyebrow>
        <h1>
          THE GAME
          <br />
          IS <em>YOURS.</em>
        </h1>
        <p>
          네 개의 숫자로 만드는
          <br />
          나만의 야구 리그
        </p>
        <div className="entry-ball" aria-hidden="true">
          ⚾
          <span>
            PLAY
            <br />
            BALL
          </span>
        </div>
      </div>
      <div className="login-box">
        <Eyebrow>WELCOME, ROOKIE</Eyebrow>
        <h2>플레이어 만들기</h2>
        <p>리그에서 쓸 이름과 아바타를 골라주세요.</p>
        <PlayerForm submitLabel="입단하기" onSubmit={onCreate} />
      </div>
    </section>
  )
}
