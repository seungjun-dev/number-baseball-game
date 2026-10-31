import type { Profile } from '../api/playerRepository'

/** 헤더의 내 프로필 버튼 → 전적 화면 */
export function ProfileChip({ profile, onClick }: { profile: Profile; onClick: () => void }) {
  return (
    <button type="button" className="profile" onClick={onClick} aria-label={`${profile.nickname} 전적 보기`}>
      <span className="profile-avatar" aria-hidden="true">
        {profile.avatar}
      </span>
      {profile.nickname} <span aria-hidden="true">⌄</span>
    </button>
  )
}
