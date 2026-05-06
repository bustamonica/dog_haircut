import { Splash } from './screens/Splash'
import { Capture } from './screens/Capture'
import { Generating } from './screens/Generating'
import { Result } from './screens/Result'
import { Paywall } from './screens/Paywall'
import { Profile } from './screens/Profile'
import { GroomerCard } from './screens/GroomerCard'
import { Settings } from './screens/Settings'
import { useStore } from './state/store'

function App() {
  const screen = useStore(s => s.screen)
  switch (screen) {
    case 'splash':
      return <Splash />
    case 'capture':
      return <Capture />
    case 'generating':
      return <Generating />
    case 'result':
      return <Result />
    case 'paywall':
      return <Paywall />
    case 'profile':
      return <Profile />
    case 'groomer-card':
      return <GroomerCard />
    case 'settings':
      return <Settings />
    default:
      return <Splash />
  }
}

export default App
