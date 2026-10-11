import Head from "next/head"
import { CONFIG } from "site.config"

export type MetaConfigProps = {
  title: string
  description: string
  type: "website" | "article"
  date?: string
  image?: string
  url: string
  canonical?: boolean
}

const MetaConfig: React.FC<MetaConfigProps> = ({ canonical = true, ...props }) => {
  const documentTitle =
    props.title === CONFIG.blog.title
      ? props.title
      : `${props.title} | ${CONFIG.blog.title}`

  return (
    <Head>
      <title>{documentTitle}</title>
      <meta name="robots" content="follow, index" />
      <meta charSet="UTF-8" />
      <meta name="description" content={props.description} />
      {canonical && <link rel="canonical" href={props.url} />}
      {/* og */}
      <meta property="og:type" content={props.type} />
      <meta property="og:title" content={props.title} />
      <meta property="og:description" content={props.description} />
      <meta property="og:url" content={props.url} />
      <meta property="og:site_name" content={CONFIG.blog.title} />
      {CONFIG.lang && <meta property="og:locale" content={CONFIG.lang} />}
      {props.image && <meta property="og:image" content={props.image} />}
      {/* twitter */}
      <meta name="twitter:title" content={props.title} />
      <meta name="twitter:description" content={props.description} />
      <meta name="twitter:card" content="summary_large_image" />
      {props.image && <meta name="twitter:image" content={props.image} />}
      {/* post */}
      {props.type === "article" && (
        <>
          <meta property="article:published_time" content={props.date} />
          <meta property="article:author" content={CONFIG.profile.name} />
        </>
      )}
    </Head>
  )
}

export default MetaConfig
