import { useState } from "react"
import { FeedProps } from "src/libs/feed/buildFeed"
import useViewMode from "src/hooks/useViewMode"

import styled from "@emotion/styled"
import ActivityCalendar from "./ActivityCalendar"
import { FeedHeader } from "./FeedHeader"
import Footer from "./Footer"
import FriendCard from "./FriendCard"
import MobileProfileCard from "./MobileProfileCard"
import OldBlogCard from "./OldBlogCard"
import PostList from "./PostList"
import PinnedPosts from "./PostList/PinnedPosts"
import Pagination from "./Pagination"
import ProfileCard from "./ProfileCard"
import SearchInput from "./SearchInput"
import SeriesList from "./SeriesList"
import ServiceCard from "./ServiceCard"
import TagList from "./TagList"

// The sticky sidebars must fit the viewport below the 3rem header and the
// grid's 2rem top/bottom padding, or the page always scrolls a little.
const HEADER_HEIGHT = 48
const GRID_PADDING = 32
const SIDEBAR_HEIGHT = `calc(100vh - ${HEADER_HEIGHT + GRID_PADDING * 2}px)`

const Feed: React.FC<FeedProps> = ({
  posts,
  page,
  totalPages,
  filter,
  categories,
  tags,
  pinned,
  postDates,
  series,
}) => {
  const [q, setQ] = useState("")
  const [view, setView] = useViewMode()
  const searching = q.trim() !== ""
  const search = <SearchInput value={q} onChange={(e) => setQ(e.target.value)} />

  return (
    <StyledWrapper>
      <div
        className="lt"
        css={{
          height: SIDEBAR_HEIGHT,
        }}
      >
        <SeriesList series={series} current={filter.series} />
        <div className="lt-tags">
          <TagList tags={tags} current={filter.tag} />
        </div>
      </div>
      <div className="mid">
        <MobileProfileCard />
        {!searching && <PinnedPosts posts={pinned} view={view} />}
        <ActivityCalendar postDates={postDates} />
        <div className="tags">
          <TagList tags={tags} current={filter.tag} />
        </div>
        <FeedHeader
          categories={categories}
          filter={filter}
          search={search}
          view={view}
          onViewChange={setView}
        />
        <PostList posts={posts} q={q} view={view} />
        {!searching && <Pagination filter={filter} page={page} totalPages={totalPages} />}
        <div className="footer">
          <Footer />
        </div>
      </div>
      <div
        className="rt"
        css={{
          height: SIDEBAR_HEIGHT,
        }}
      >
        <ProfileCard />
        <ServiceCard />
        <FriendCard />
        <OldBlogCard />
        <div className="footer">
          <Footer />
        </div>
      </div>
    </StyledWrapper>
  )
}

export default Feed

const StyledWrapper = styled.div`
  grid-template-columns: repeat(12, minmax(0, 1fr));

  padding: 2rem 0;
  display: grid;
  gap: 1.5rem;

  @media (max-width: 768px) {
    display: block;
    padding: 0.5rem 0;
  }

  > .lt {
    display: none;
    position: sticky;
    grid-column: span 2 / span 2;
    top: ${HEADER_HEIGHT + GRID_PADDING}px;
    padding-bottom: 1rem;

    @media (min-width: 1024px) {
      /* Only the tag list scrolls, inside the sidebar's height. */
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    > .lt-tags {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;

      > div {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }
      .list {
        flex: 1;
        min-height: 0;
        margin-bottom: 0;
        overflow-y: auto;
      }
    }
  }

  > .mid {
    grid-column: span 12 / span 12;

    @media (min-width: 1024px) {
      grid-column: span 7 / span 7;
    }

    > .tags {
      display: block;

      @media (min-width: 1024px) {
        display: none;
      }
    }

    > .footer {
      padding-bottom: 2rem;
      @media (min-width: 1024px) {
        display: none;
      }
    }
  }

  > .rt {
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
    }

    display: none;
    overflow: scroll;
    position: sticky;
    top: ${HEADER_HEIGHT + GRID_PADDING}px;

    @media (min-width: 1024px) {
      display: block;
      grid-column: span 3 / span 3;
    }

    .footer {
      padding-top: 1rem;
    }
  }
`
