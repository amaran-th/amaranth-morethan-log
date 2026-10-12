import styled from "@emotion/styled"
import React from "react"
import { MdGridView, MdViewAgenda, MdViewList } from "react-icons/md"
import { ViewMode } from "src/libs/feed/viewMode"

type Props = {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}

const OPTIONS: { mode: ViewMode; label: string; Icon: typeof MdViewAgenda }[] = [
  { mode: "feed", label: "피드로 보기", Icon: MdViewAgenda },
  { mode: "list", label: "리스트로 보기", Icon: MdViewList },
  { mode: "gallery", label: "갤러리로 보기", Icon: MdGridView },
]

const ViewToggle: React.FC<Props> = ({ mode, onChange }) => (
  <StyledWrapper role="radiogroup" aria-label="보기 방식">
    {OPTIONS.map(({ mode: value, label, Icon }) => (
      <button
        key={value}
        type="button"
        role="radio"
        aria-checked={mode === value}
        aria-label={label}
        title={label}
        data-active={mode === value}
        onClick={() => onChange(value)}
      >
        <Icon />
      </button>
    ))}
  </StyledWrapper>
)

export default ViewToggle

const StyledWrapper = styled.div`
  display: flex;
  flex-shrink: 0;

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0;
    border-radius: 0.5rem;
    font-size: 1.125rem;
    color: ${({ theme }) => theme.colors.gray10};
    transition: color 0.15s ease;
    :hover {
      color: ${({ theme }) => theme.colors.gray12};
    }
    /* The selected mode is marked by its icon colour alone. */
    &[data-active="true"] {
      color: ${({ theme }) => theme.colors.blue11};
    }
  }
`
