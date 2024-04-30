import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Link
} from '@chakra-ui/react'

export type Proposal = {
  id: number,
  name: string,
  account: string,
  function: string,
  yesWeight: number,
  noWeight: number,
  status: string,
  stage: string,
  memo: string,
  createdTime: string
}

export type ProposalsTableProps = {
  proposals: Proposal[],
  totalRespect: number
} 

export default function ProposalsTable(props: ProposalsTableProps) {
  const rows = props.proposals.map((proposal) => {
    const totalVotes = proposal.yesWeight + proposal.noWeight;
    return (
      <Link
        href="https://chakra-ui.com"
        isExternal
        cursor="pointer"
        display="contents" // <------ Note this style
      >
        <Tr key={proposal.id}>
          <Td>{proposal.id}</Td>
          <Td>{proposal.name}</Td>
          <Td>{proposal.memo}</Td>
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
      </Link>
    )
  });


  return (
    // TODO: smaller table for smaller screens
    <>
      <TableContainer>
        <Table size="lg" variant='simple'>
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
