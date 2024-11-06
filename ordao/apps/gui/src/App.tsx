// import { useState } from 'react'
// import './App.css'
import { Proposal } from "./global/types.js"
import AppBar from "./components/AppBar.js"
import { useDisclosure } from "@chakra-ui/react"
import ProposalsTable from "./components/ProposalsTable.js"
import ProposalModal from "./components/ProposalModal.js"
import ProposalFormModal from './components/ProposalFormModal.js'
// import { Box, Center, Flex } from "@chakra-ui/react"

const proposals: Proposal[] = [
  {
    id: 0,
    name: "First Proposal",
    account: "0x7aB...D3",
    function: "mint",
    yesWeight: 100,
    noWeight: 60,
    status: "Failing",
    stage: "Voting",
    memo: "This is description",
    createdTime: "2 days ago",
    cdata: "0x0002132443dsfasfddsdsdsflkjf234afsadkjfdk"
  },
  {
    id: 1,
    name: "Second proposal",
    account: "0x7aB...D3",
    function: "mint",
    yesWeight: 100,
    noWeight: 20,
    status: "Passing",
    stage: "Voting",
    memo: "This is description.",
    createdTime: "4 days ago",
    cdata: "0x0002132443dsfasfddsdsdsflkjf234afsadkjfdk"
  },
  {
    id: 2,
    name: "Third proposal",
    account: "0x7aB...D3",
    function: "burn",
    yesWeight: 400,
    noWeight: 20,
    status: "Ready for execution",
    stage: "Execution",
    memo: "This is description. It is a longer description than others. It is intended to take up some space. It's a good idea to take up some space here.",
    createdTime: "8 days ago",
    cdata: "0x0002132443dsfasfddsdsdsflkjf234afsadkjfdk"
  }
]

function App() {
  const { isOpen: propIsOpen, onOpen: propOnOpen, onClose: propOnClose } = useDisclosure()
  const { isOpen: propFormIsOpen, onOpen: propFormOnOpen, onClose: propFormOnClose } = useDisclosure()

  return (
    <>
      <AppBar onNewPropClick={() => { propOnClose(); propFormOnOpen(); }}/>
      <ProposalsTable
        proposals={proposals}
        totalRespect={1000}
        onProposalClick={() => { propFormOnClose(); propOnOpen(); }}
      />
      <ProposalModal
        proposal={proposals[0]}
        isOpen={propIsOpen}
        onClose={propOnClose}
      />

      <ProposalFormModal 
        isOpen={propFormIsOpen}
        onClose={propFormOnClose}
      />

    </>
  )
}

export default App
