import styled from "@emotion/styled"
import React from "react"
import {
  AiFillLinkedin,
  AiOutlineGithub,
  AiOutlineInstagram,
  AiOutlineMail,
} from "react-icons/ai"
import { CONFIG } from "site.config"

const ContactCard: React.FC = () => {
  return (
    <>
      <StyledWrapper>
        {CONFIG.profile.github && (
          <a
            href={`https://github.com/${CONFIG.profile.github}`}
            rel="noreferrer"
            target="_blank"
          >
            <AiOutlineGithub className="icon" />
            <div className="name">github</div>
          </a>
        )}
        {CONFIG.profile.instagram && (
          <a
            href={`https://www.instagram.com/${CONFIG.profile.instagram}`}
            rel="noreferrer"
            target="_blank"
          >
            <AiOutlineInstagram className="icon" />
            <div className="name">instagram</div>
          </a>
        )}
        {CONFIG.profile.email && (
          <a
            href={`mailto:${CONFIG.profile.email}`}
            rel="noreferrer"
            target="_blank"
            css={{ overflow: "hidden" }}
          >
            <AiOutlineMail className="icon" />
            <div className="name">email</div>
          </a>
        )}
        {CONFIG.profile.linkedin && (
          <a
            href={`https://www.linkedin.com/in/${CONFIG.profile.linkedin}`}
            rel="noreferrer"
            target="_blank"
          >
            <AiFillLinkedin className="icon" />
            <div className="name">linkedin</div>
          </a>
        )}
      </StyledWrapper>
    </>
  )
}

export default ContactCard

const StyledWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: 0.4rem;
  border-top: 1px solid ${({ theme }) => theme.colors.gray5};
  background-color: ${({ theme }) =>
    theme.scheme === "light" ? "white" : theme.colors.gray4};
  > a {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    border-radius: 1rem;
    color: ${({ theme }) => theme.colors.gray11};
    cursor: pointer;
    :hover {
      color: ${({ theme }) => theme.colors.gray12};
    }
    .icon {
      font-size: 1rem;
      line-height: 2rem;
    }
    .name {
      font-size: 0.8rem;
      line-height: 1.25rem;
    }
  }
`
