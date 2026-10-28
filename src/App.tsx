import { useState } from 'react'

type Guess = { value: string; strike: number; ball: number; label: string }
const answer = '4271'

function App() {
  const [darkMode, setDarkMode] = useState(false)
  const design = darkMode ? 'broadcast' : 'editorial'
  const [screen, setScreen] = useState<'login' | 'home' | 'game' | 'result'>('login')
  const [digits, setDigits] = useState(['', '', '', ''])
  const [guesses, setGuesses] = useState<Guess[]>([])
  const [phase, setPhase] = useState<'idle' | 'swing' | 'miss' | 'call' | 'victory'>('idle')
  const [message, setMessage] = useState('')
  const [won, setWon] = useState(false)

  const reset = (next: 'login' | 'home' | 'game' | 'result') => {
    setScreen(next)
    if (next === 'game') { setGuesses([]); setDigits(['', '', '', '']); setPhase('idle'); setMessage('') }
  }

  const play = () => {
    const value = digits.join('')
    if (value.length !== 4 || new Set(value).size !== 4 || phase !== 'idle') return
    const strike = [...value].filter((n, i) => n === answer[i]).length
    const ball = [...value].filter((n, i) => n !== answer[i] && answer.includes(n)).length
    const label = strike + ball === 0 ? 'OUT!' : `${ball} BALL · ${strike} STRIKE${strike === 1 ? '' : 'S'}!`
    const row = { value, strike, ball, label }
    setGuesses((old) => [...old, row]); setWon(strike === 4); setPhase('swing')
    window.setTimeout(() => setPhase('miss'), 700)
    window.setTimeout(() => { setMessage(label); setPhase(strike === 4 ? 'victory' : 'call') }, 1450)
    window.setTimeout(() => {
      if (strike === 4 || guesses.length >= 8) setScreen('result')
      else { setPhase('idle') }
    }, strike === 4 ? 3100 : 2500)
  }

  return <main className={`concept-shell ${design}`}>
    <header className="concept-nav"><button className="wordmark" onClick={() => reset('login')}><span className="logo-ball">⚾</span> NUMBER <b>LEAGUE</b></button><div className="theme-control"><span>{darkMode ? 'DARK · CONCEPT 04' : 'LIGHT · CONCEPT 05'}</span><button className={darkMode ? 'is-dark' : ''} onClick={() => setDarkMode((value) => !value)} aria-label={darkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}><i/>{darkMode ? '다크모드' : '라이트모드'}</button></div><button className="profile" onClick={() => reset('login')}>민지 <span>⌄</span></button></header>

    {screen === 'login' && <section className="entry-screen"><div className="entry-copy"><span className="eyebrow">2025 · NEW SEASON</span><h1>THE GAME<br/>IS <em>YOURS.</em></h1><p>네 개의 숫자로 만드는<br/>나만의 야구 리그</p><div className="entry-ball" aria-hidden="true">⚾<span>PLAY<br/>BALL</span></div></div><div className="login-box"><span className="eyebrow">WELCOME, ROOKIE</span><h2>클럽에 입장하기</h2><p>간편 로그인으로 바로 시작하세요.</p><button className="login-option naver" onClick={() => reset('home')}><b>N</b> 네이버로 시작하기 <span>↗</span></button><button className="login-option kakao" onClick={() => reset('home')}><b>●</b> 카카오로 시작하기 <span>↗</span></button><button className="login-option google" onClick={() => reset('home')}><b>G</b> Google로 시작하기 <span>↗</span></button><small>계속 진행하면 이용약관 및 개인정보 처리방침에 동의합니다.</small></div></section>}

    {screen === 'home' && <section className="home-screen"><span className="eyebrow">YOUR CLUBHOUSE / 01</span><h1>오늘의 라인업은<br/><em>어떻게 갈까요?</em></h1><div className="mode-cards"><button onClick={() => reset('game')}><span className="mode-index">01 — SOLO</span><b className="mode-emoji">⚾</b><strong>싱글 플레이</strong><small>혼자 기록을 깨는 연습 경기</small><i>START GAME ↗</i></button><button onClick={() => reset('game')}><span className="mode-index">02 — VERSUS</span><b className="mode-emoji">🏆</b><strong>1:1 대전</strong><small>친구와 맞붙는 실시간 승부</small><i>FIND MATCH ↗</i></button></div><div className="tip-line">✦ &nbsp; 숫자는 중복 없이 네 개를 골라주세요.</div></section>}

    {screen === 'game' && <section className="match-screen"><div className="guess-entry"><span className="eyebrow">YOUR PITCH</span><div className="guess-controls">{digits.map((digit, i) => <input key={i} aria-label={`숫자 ${i + 1}`} inputMode="numeric" maxLength={1} value={digit} onChange={(e) => setDigits((old) => old.map((v, j) => j === i ? e.target.value.replace(/\D/g, '').slice(-1) : v))}/>)}</div><button className="pitch-button" onClick={play} disabled={digits.some((d) => !d) || new Set(digits).size !== 4 || phase !== 'idle'}>투구 <span>↗</span></button></div>
      <div className={`playfield ${phase}`}>
        {phase === 'idle' ? <><div className="field-meta"><span>LIVE PLAY</span><span>{String(guesses.length + 1).padStart(2, '0')} / 09</span></div><div className="idle-illustration"><div className="sun-disc"/><div className="bat-silhouette">🏏</div><div className="standing-player">🧢</div><div className="idle-speech">어디로 던져볼까?</div><div className="field-mark mark-one"/><div className="field-mark mark-two"/></div><div className="field-caption">타석의 긴장감을 느껴봐!</div></> : <><div className="field-meta"><span>PLAY BY PLAY</span><span>REPLAY ●</span></div><div className={`cartoon-stage ${phase}`}><div className="comic-burst">{phase === 'swing' ? 'SWING!' : phase === 'miss' ? 'WHOOSH!' : phase === 'victory' ? 'HOME RUN!' : message}</div><div className="comic-player">{phase === 'swing' ? '🏏' : phase === 'victory' ? '🏆' : '🧢'}</div><div className="comic-ball">{phase === 'victory' ? '🌟' : '⚾'}</div><div className="speed-line line-a"/><div className="speed-line line-b"/><div className="comic-dust">✦</div><div className="out-call">{phase === 'call' && message === 'OUT!' ? 'OUT!' : phase === 'victory' ? '4 STRIKE!' : ''}</div><div className="win-confetti">✦　✧　✦</div></div><div className="field-caption result-caption">{phase === 'victory' ? '정답! 승리의 순간을 즐겨요!' : phase === 'call' ? message : phase === 'swing' ? '타자가 힘껏 스윙!' : '공이 배트를 살짝 빗나가요!'}</div></>}
      </div>
      <div className="dashboard"><div className="dashboard-heading"><div><span className="eyebrow">SCOREBOARD</span><h2>경기 대시보드</h2></div><span className="score-legend"><b>● S</b> 스트라이크　<b>● B</b> 볼</span></div>{guesses.length === 0 ? <div className="score-empty">첫 투구를 기다리는 중 <span>···</span></div> : <div className="score-list">{[...guesses].reverse().map((guess, i) => <div className="score-row" key={`${guess.value}-${i}`}><span>{String(guesses.length - i).padStart(2, '0')}</span><b>{guess.value.split('').join('　')}</b><small>{guess.label}</small></div>)}</div>}</div>
      <button className="leave-game" onClick={() => reset('home')}>← &nbsp; 경기 나가기</button></section>}

    {screen === 'result' && <section className="final-screen"><span className="eyebrow">FINAL SCORE / GAME OVER</span><div className="final-icon">{won ? '🏆' : '⚾'}</div><h1>{won ? <>NICE<br/><em>HIT!</em></> : <>GOOD<br/><em>GAME.</em></>}</h1><p>정답 숫자 <b>{answer.split('').join(' · ')}</b> · {guesses.length}회 도전</p><div className="final-board"><span className="eyebrow">YOUR SCOREBOARD</span>{guesses.map((g, i) => <div className="score-row" key={`${g.value}-${i}`}><span>{String(i + 1).padStart(2, '0')}</span><b>{g.value.split('').join('　')}</b><small>{g.label}</small></div>)}</div><button className="pitch-button" onClick={() => reset('game')}>한 판 더 하기 ↗</button><button className="leave-game" onClick={() => reset('home')}>모드 선택으로 돌아가기</button></section>}

    <footer className="concept-footer"><span>NUMBER LEAGUE · PLAY FAIR, PLAY FUN</span><span>CONCEPT {darkMode ? '04' : '05'} &nbsp; / &nbsp; {darkMode ? 'LIVE BROADCAST' : 'MINIMAL EDITORIAL'} </span></footer>
  </main>
}

export default App
