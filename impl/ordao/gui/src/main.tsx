import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, Container } from '@chakra-ui/react'
import './index.css'
import BreakoutSubmitApp from './BreakoutSubmitApp'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider>
      <Container minHeight="100vh">
        <BreakoutSubmitApp />
      </Container>
    </ChakraProvider>
  </React.StrictMode>,
)
