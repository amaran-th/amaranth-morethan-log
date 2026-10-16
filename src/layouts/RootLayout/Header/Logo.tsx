import Link from "next/link"
import { CONFIG } from "site.config"
import styled from "@emotion/styled"

// Jellyfish mark plus the "amaranth.log" wordmark, both from /public.
const Logo = () => {
  return (
    <StyledWrapper href="/" aria-label={CONFIG.blog.title}>
      <img className="icon" src="/logo_icon.svg" alt="" width={23} height={20} />
      <img className="text" src="/logo_text.svg" alt={CONFIG.blog.title} width={70} height={29} />
    </StyledWrapper>
  )
}

export default Logo

const StyledWrapper = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.375rem;

  .icon {
    width: auto;
    height: 1.75rem;
  }
  .text {
    width: auto;
    height: 2rem;
  }
  :hover .icon {
    transform: rotate(-8deg);
  }
  .icon {
    transition: transform 0.2s ease;
  }
`
