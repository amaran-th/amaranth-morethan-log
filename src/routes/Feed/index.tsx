import { useState } from "react"
import { FeedProps } from "src/libs/feed/buildFeed"

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
import ServiceCard from "./ServiceCard"
import TagList from "./TagList"

const HEADER_HEIGHT = 73

const Feed: React.FC<FeedProps> = ({
  posts,
  page,
  totalPages,
  filter,
  categories,
  tags,
  pinned,
  postDates,
}) => {
  const [q, setQ] = useState("")
  const searching = q.trim() !== ""
  // One input, rendered in the right sidebar on wide screens and above the
  // list on mobile, where the sidebars are hidden.
  const search = <SearchInput value={q} onChange={(e) => setQ(e.target.value)} />

  return (
    <StyledWrapper>
      <div
        className="lt"
        css={{
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        }}
      >
        <ProfileCard />
        <TagList tags={tags} current={filter.tag} />
      </div>
      <div className="mid">
        <MobileProfileCard />
        <div className="mobile-only">{search}</div>
        {!searching && <PinnedPosts posts={pinned} />}
        <ActivityCalendar postDates={postDates} />
        <div className="tags">
          <TagList tags={tags} current={filter.tag} />
        </div>
        <FeedHeader categories={categories} filter={filter} />
        <PostList posts={posts} q={q} />
        {!searching && <Pagination filter={filter} page={page} totalPages={totalPages} />}
        <div className="footer">
          <Footer />
        </div>
      </div>
      <div
        className="rt"
        css={{
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        }}
      >
        {search}
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
    overflow: scroll;
    position: sticky;
    grid-column: span 2 / span 2;
    top: ${HEADER_HEIGHT - 10}px;

    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
    }

    @media (min-width: 1024px) {
      display: block;
    }
  }

  > .mid {
    grid-column: span 12 / span 12;

    @media (min-width: 1024px) {
      grid-column: span 7 / span 7;
    }

    > .mobile-only {
      @media (min-width: 1024px) {
        display: none;
      }
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
    top: ${HEADER_HEIGHT - 10}px;

    @media (min-width: 1024px) {
      display: block;
      grid-column: span 3 / span 3;
    }

    .footer {
      padding-top: 1rem;
    }
  }
`
