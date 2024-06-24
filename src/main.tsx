import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '../app/globals.css'
import App from './App.tsx'
import { ThemeProvider } from './components/theme-provider.tsx'
import './styles/style.css'
import './styles/utils.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  
    <BrowserRouter>
    
    <ThemeProvider defaultTheme='dark'>
    <App />
    </ThemeProvider>
    </BrowserRouter>
    
  
)
