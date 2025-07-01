import styled from "@emotion/styled"
import React from "react"
import { IoArrowBackCircle } from "react-icons/io5"
import { CONFIG } from "site.config"
import { Emoji } from "src/components/Emoji"

const OldBlogCard: React.FC = () => {
  if (!CONFIG.oldBlog) return null
  return (
    <>
      <StyledTitle>
        <Emoji>↩️</Emoji> Old Blog
      </StyledTitle>
      <StyledWrapper>
        <a href={`${CONFIG.oldBlog.href}`} rel="noreferrer" target="_blank">
          <IoArrowBackCircle className="icon" />
          <div className="name">{CONFIG.oldBlog.name}</div>
        </a>
      </StyledWrapper>
    </>
  )
}

export default OldBlogCard

const StyledTitle = styled.div`
  padding: 0.25rem;
  margin-bottom: 0.75rem;
`

const StyledWrapper = styled.div`
  display: flex;
  padding: 0.25rem;
  flex-direction: column;
  border-radius: 1rem;
  background-color: ${({ theme }) =>
    theme.scheme === "light" ? "white" : theme.colors.gray4};
  a {
    display: flex;
    padding: 0.75rem;
    gap: 0.75rem;
    align-items: center;
    border-radius: 1rem;
    color: ${({ theme }) => theme.colors.gray11};
    cursor: pointer;

    :hover {
      color: ${({ theme }) => theme.colors.gray12};
      background-color: ${({ theme }) => theme.colors.gray5};
    }
    .icon {
      font-size: 1.5rem;
      line-height: 2rem;
    }
    .name {
      font-size: 0.875rem;
      line-height: 1.25rem;
    }
  }
`
