import styled from "@emotion/styled"
import Image from "next/image"
import React from "react"
import { CONFIG } from "site.config"
import { Emoji } from "src/components/Emoji"

const FriendCard: React.FC = () => {
  if (!CONFIG.friends) return null
  return (
    <>
      <StyledTitle>
        <Emoji>💌</Emoji> Friends
      </StyledTitle>
      <StyledWrapper>
        {CONFIG.friends.map(friend=><a key={friend.name} href={`${friend.link}`} rel="noreferrer" target="_blank">
          <Image
            src={`${friend.link}/_next/image?url=${friend.thumbnail}`}
            alt={`${friend.name} 프로필`}
            className="icon"
            width={24}
            height={24}
          />
          <div className="name">{friend.name}</div>
        </a>)}
        
      </StyledWrapper>
    </>
  )
}

export default FriendCard

const StyledTitle = styled.div`
  padding: 0.25rem;
  margin-bottom: 0.75rem;
`

const StyledWrapper = styled.div`
  display: flex;
  padding: 0.25rem;
  flex-direction: column;
  border-radius: 1rem;
  margin-bottom: 2.25rem;
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
      border-radius: 100%;
    }
    .name {
      font-size: 0.875rem;
      line-height: 1.25rem;
    }
  }
`
