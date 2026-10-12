import styled from "@emotion/styled"
import Link from "next/link"
import React from "react"
import { MdExpandMore } from "react-icons/md"
import { DEFAULT_CATEGORY } from "src/constants"
import useDropdown from "src/hooks/useDropdown"
import { FeedFilter, feedPath } from "src/libs/feed"
import { TCategories } from "src/types"

type Props = {
  categories: TCategories
  filter: FeedFilter
}

const CategorySelect: React.FC<Props> = ({ categories: data, filter }) => {
  const [dropdownRef, opened, handleOpen] = useDropdown()

  const currentCategory =
    filter.category ??
    (filter.tag ? `#${filter.tag}` : filter.series ? `📚 ${filter.series}` : DEFAULT_CATEGORY)

  return (
    <StyledWrapper>
      <div ref={dropdownRef} className="wrapper" onClick={handleOpen}>
        {currentCategory} Posts <MdExpandMore />
      </div>
      {opened && (
        <div className="content">
          {Object.keys(data).map((key, idx) => (
            <Link
              className="item"
              key={idx}
              href={key === DEFAULT_CATEGORY ? "/" : feedPath({ category: key }, 1)}
            >
              {`${key} (${data[key]})`}
            </Link>
          ))}
        </div>
      )}
    </StyledWrapper>
  )
}

export default CategorySelect

const StyledWrapper = styled.div`
  position: relative;
  > .wrapper {
    display: flex;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    gap: 0.25rem;
    align-items: center;
    font-size: 1.25rem;
    line-height: 1.75rem;
    font-weight: 700;
    cursor: pointer;
  }
  > .content {
    position: absolute;
    z-index: 40;
    padding: 0.25rem;
    border-radius: 0.75rem;
    background-color: ${({ theme }) => theme.colors.blue2};
    color: ${({ theme }) => theme.colors.gray10};
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    > .item {
      display: block;
      padding: 0.25rem;
      padding-left: 0.5rem;
      padding-right: 0.5rem;
      border-radius: 0.75rem;
      font-size: 0.875rem;
      line-height: 1.25rem;
      white-space: nowrap;
      cursor: pointer;

      :hover {
        background-color: ${({ theme }) => theme.colors.gray4};
      }
    }
  }
`
