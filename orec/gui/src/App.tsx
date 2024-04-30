// import { useState } from 'react'
// import './App.css'
import ProposalsTable, { Proposal } from "./components/ProposalsTable"

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
    createdTime: "2 days ago"
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
    memo: "This is description",
    createdTime: "4 days ago"
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
    memo: "This is description",
    createdTime: "8 days ago"
  }
]

function App() {

  return (
    <ProposalsTable proposals={proposals} totalRespect={1000} />
  )
}

export default App
