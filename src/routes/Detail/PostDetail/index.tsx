import React, { useMemo } from "react"
import PostHeader from "./PostHeader"
import Footer from "./PostFooter"
import CommentBox from "./CommentBox"
import PostNavigation from "./PostNavigation"
import SeriesCarousel from "./SeriesCarousel"
import TableOfContents from "./TableOfContents"
import { buildToc } from "src/libs/utils/notion/toc"
import Category from "src/components/Category"
import styled from "@emotion/styled"
import NotionRenderer from "../components/NotionRenderer"
import usePostQuery from "src/hooks/usePostQuery"

type Props = {}

const PostDetail: React.FC<Props> = () => {
  const data = usePostQuery()
  const toc = useMemo(() => (data ? buildToc(data.recordMap, data.id) : []), [data])

  if (!data) return null

  const category = (data.category && data.category?.[0]) || undefined

  const showToc = data.type[0] === "Post" && toc.length >= 2

  return (
    <StyledWrapper data-toc={showToc}>
      {showToc && (
        <aside className="toc">
          <TableOfContents items={toc} />
        </aside>
      )}
      <article>
        {category && (
          <div css={{ marginBottom: "0.5rem" }}>
            <Category readOnly={data.status?.[0] === "PublicOnDetail"}>
              {category}
            </Category>
          </div>
        )}
        {data.type[0] === "Post" && <PostHeader data={data} />}
        <div>
          <NotionRenderer recordMap={data.recordMap} />
        </div>
        {data.type[0] === "Post" && (
          <>
            <Footer />
            <CommentBox data={data} />
            {data.seriesNav && <SeriesCarousel series={data.seriesNav} />}
            <PostNavigation adjacent={data.adjacent} />
          </>
        )}
      </article>
    </StyledWrapper>
  )
}

export default PostDetail

const StyledWrapper = styled.div`
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-top: 3rem;
  padding-bottom: 3rem;
  border-radius: 1.5rem;
  max-width: 56rem;
  background-color: ${({ theme }) =>
    theme.scheme === "light" ? "white" : theme.colors.gray4};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin: 0 auto;
  position: relative;

  /* The outline sits right of the post card. From 1440px it fits in the
     free space beside the centred card; between 1024px and 1440px the card
     moves left and gives up 14.5rem so the outline fits inside the layout. */
  > .toc {
    display: none;
    position: absolute;
    top: 0;
    bottom: 0;
    left: calc(100% + 2rem);
    width: 14rem;

    @media (min-width: 1024px) {
      display: block;
    }
    @media (min-width: 1024px) and (max-width: 1439px) {
      left: calc(100% + 1.5rem);
      width: 13rem;
    }
  }
  @media (min-width: 1024px) and (max-width: 1439px) {
    &[data-toc="true"] {
      margin-left: 0;
      margin-right: 14.5rem;
    }
  }
  > article {
    margin: 0 auto;
    max-width: 42rem;
  }
`
