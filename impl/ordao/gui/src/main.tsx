import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, Container } from '@chakra-ui/react'
import './index.css'
import BreakoutSubmitApp from './BreakoutSubmitApp'
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider>
      <Container minHeight="100vh">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<BreakoutSubmitApp />}/>
          </Routes>
        </BrowserRouter>
      </Container>
    </ChakraProvider>
  </React.StrictMode>,
)
