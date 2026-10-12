import { TCategories } from "src/types"
import React from "react"
import CategorySelect from "./CategorySelect"
import styled from "@emotion/styled"
import { FeedFilter } from "src/libs/feed"
import { ViewMode } from "src/libs/feed/viewMode"
import ViewToggle from "./ViewToggle"

type Props = {
  categories: TCategories
  filter: FeedFilter
  search: React.ReactNode
  view: ViewMode
  onViewChange: (mode: ViewMode) => void
}

const FeedHeader: React.FC<Props> = ({ categories, filter, search, view, onViewChange }) => {
  return (
    <StyledWrapper>
      <CategorySelect categories={categories} filter={filter} />
      <div className="tools">
        {search}
        <ViewToggle mode={view} onChange={onViewChange} />
      </div>
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

  > .tools {
    display: flex;
    flex: 1;
    justify-content: flex-end;
    align-items: center;
    gap: 0.25rem;
    min-width: 0;
  }
`
