export function AppFooter({ caption }: { caption: string }) {
  return (
    <footer className="concept-footer">
      <span>NUMBER LEAGUE · PLAY FAIR, PLAY FUN</span>
      <span>{caption}</span>
    </footer>
  )
}
