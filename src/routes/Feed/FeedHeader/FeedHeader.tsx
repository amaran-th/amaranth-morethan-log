import { TCategories } from "src/types"
import React from "react"
import CategorySelect from "./CategorySelect"
import styled from "@emotion/styled"
import { FeedFilter } from "src/libs/feed"

type Props = {
  categories: TCategories
  filter: FeedFilter
}

const FeedHeader: React.FC<Props> = ({ categories, filter }) => {
  return (
    <StyledWrapper>
      <CategorySelect categories={categories} filter={filter} />
    </StyledWrapper>
  )
}

export default FeedHeader

const StyledWrapper = styled.div`
  display: flex;
  margin-bottom: 1rem;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray6};
`
