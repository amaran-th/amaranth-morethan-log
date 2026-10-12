import styled from "@emotion/styled"
import React, { InputHTMLAttributes } from "react"
import { MdSearch } from "react-icons/md"

interface Props extends InputHTMLAttributes<HTMLInputElement> {}

// Compact search field that sits at the right end of the list header row.
const SearchInput: React.FC<Props> = ({ ...props }) => {
  return (
    <StyledWrapper>
      <MdSearch className="icon" aria-hidden />
      <input type="search" placeholder="Search" aria-label="글 검색" {...props} />
    </StyledWrapper>
  )
}

export default SearchInput

const StyledWrapper = styled.label`
  position: relative;
  display: flex;
  align-items: center;
  width: 13rem;
  min-width: 0;
  flex-shrink: 1;

  > .icon {
    position: absolute;
    left: 0.75rem;
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.gray10};
    pointer-events: none;
  }
  > input {
    width: 100%;
    padding: 0.375rem 0.75rem 0.375rem 2.25rem;
    border-radius: 9999px;
    outline-style: none;
    font-size: 0.875rem;
    background-color: ${({ theme }) => theme.colors.blue4};
    ::placeholder {
      color: ${({ theme }) => theme.colors.gray10};
    }
  }
`
