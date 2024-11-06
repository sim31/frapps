import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react'
import { Proposal } from '../global/types.js';


export type ProposalsTableProps = {
  proposals: Proposal[],
  totalRespect: number,
  onProposalClick: (propId: number) => void;
} 

export default function ProposalsTable(props: ProposalsTableProps) {

  const rows = props.proposals.map((proposal) => {
    const totalVotes = proposal.yesWeight + proposal.noWeight;
    return (
      <Tr
        key={proposal.id}
        cursor="pointer"
        _hover={{
          background: "lightblue"
        }}
        onClick={() => props.onProposalClick(proposal.id)}
      >
        <Td>{proposal.id}</Td>
        <Td>{proposal.name}</Td>
        {/* TODO: display truncated text properly */}
        <Td>{proposal.memo.substring(0, 20)}</Td>
        {/* <Td>{proposal.account}</Td>
        <Td>{proposal.function}</Td> */}
        <Td isNumeric>{totalVotes}</Td>
        <Td isNumeric>100 (70%)</Td>
        <Td isNumeric>60 (30%)</Td>
        {/* <Td isNumeric>{totalVotes / props.totalRespect}</Td> */}
        <Td>{proposal.stage}</Td>
        <Td>4 hours</Td>
        <Td>{proposal.status}</Td>
        <Td>{proposal.createdTime}</Td>
      </Tr>
    )
  });


  return (
    // TODO: smaller table for smaller screens
    <>
      <TableContainer>
        <Table size="lg" variant='simple' align="center">
          <Thead>
            <Tr>
              <Th>Id</Th>
              <Th>Name</Th>
              <Th>Memo</Th>
              {/* <Th>Account</Th>
              <Th>Function</Th> */}
              <Th isNumeric>Votes</Th>
              <Th isNumeric>YES</Th>
              <Th isNumeric>NO</Th>
              {/* <Th isNumeric>Turnout</Th> */}
              <Th>Stage</Th>
              <Th>Time Remaining</Th>
              <Th>Status</Th>
              <Th>Create Time</Th>
            </Tr>
          </Thead>
          <Tbody>
            {rows}
          </Tbody>
          {/* <Tfoot>
            <Tr>
              <Th>To convert</Th>
              <Th>into</Th>
              <Th isNumeric>multiply by</Th>
            </Tr>
          </Tfoot> */}
        </Table>
      </TableContainer>
    </>
  )
}
