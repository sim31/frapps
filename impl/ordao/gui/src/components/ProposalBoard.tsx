import { useDisclosure } from "@chakra-ui/react"
import ProposalsTable from "./ProposalsTable.js"
import { Proposal } from "../global/types.js"
import ProposalModal from "./ProposalModal.js"


export type ProposalBoardProps = {
  proposals: Proposal[],
  totalRespect: number
}

export default function ProposalBoard(props: ProposalBoardProps) {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <ProposalsTable
        proposals={props.proposals}
        totalRespect={props.totalRespect}
        onProposalClick={onOpen}
      />
      <ProposalModal
        proposal={props.proposals[0]}
        isOpen={isOpen}
        onClose={onClose}
      />
    </>

  )
}