import { Splash } from './screens/Splash'
import { Capture } from './screens/Capture'
import { Breed } from './screens/Breed'
import { Generating } from './screens/Generating'
import { Result } from './screens/Result'
import { Paywall } from './screens/Paywall'
import { Library } from './screens/Library'
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
    case 'breed':
      return <Breed />
    case 'generating':
      return <Generating />
    case 'result':
      return <Result />
    case 'paywall':
      return <Paywall />
    case 'library':
      return <Library />
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
