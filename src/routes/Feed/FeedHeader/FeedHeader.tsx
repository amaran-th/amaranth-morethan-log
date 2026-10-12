import { TCategories } from "src/types"
import React from "react"
import CategorySelect from "./CategorySelect"
import styled from "@emotion/styled"
import { FeedFilter } from "src/libs/feed"

type Props = {
  categories: TCategories
  filter: FeedFilter
  search: React.ReactNode
}

const FeedHeader: React.FC<Props> = ({ categories, filter, search }) => {
  return (
    <StyledWrapper>
      <CategorySelect categories={categories} filter={filter} />
      {search}
    </StyledWrapper>
  )
}

export default FeedHeader

const StyledWrapper = styled.div`
  display: flex;
  gap: 1rem;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray6};
`
