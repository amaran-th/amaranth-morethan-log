const CONFIG = {
  profile: {
    name: "amaranth",
    image: "/jellyfish.png",
    role: "프론트엔드 개발자",
    bio: "인생을 좋아하는 것으로 가득 채우자",
    email: "songsy405@naver.com",
    linkedin: "seyeon-song",
    github: "amaran-th",
    instagram: "",
  },
  projects: null, //[
  //   {
  //     name: `morethan-log`,
  //     href: "https://github.com/morethanmin/morethan-log",
  //   },
  //],
  friends:[{
    name:"Chaeyeon",
    thumbnail:"%2F유치원%20몰티즈.jpeg&w=3840&q=75",
    link:"https://docs.chaeyeon.dev"
  },{
    name:"vvony",
    thumbnail:"%2Fmaru-avatar.png&w=3840&q=75",
    link:"https://vvony.vercel.app"
  }],
  blog: {
    title: "세록세록",
    description: "개발 기록",
    image: "https://amaran-th.vercel.app/jellyfish.png",
    scheme: "light", // 'light' | 'dark' | 'system'
  },
  oldBlog: {
    name: `아마란스 꽃밭`,
    href: "https://amaran-th.github.io",
    image: "/old-character.png",
  },
  // CONFIG configration (required)
  link: "https://amaran-th.vercel.app",
  since: 2025,
  lang: "ko-KR",
  ogImageGenerateURL: "https://og-image-korean.vercel.app", // The link to generate OG image, don't end with a slash

  // notion configuration (required)
  notionConfig: {
    pageId: process.env.NOTION_PAGE_ID,
  },

  // plugin configuration (optional)
  googleAnalytics: {
    enable: true,
    config: {
      measurementId: process.env.NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID || "",
    },
  },
  googleSearchConsole: {
    enable: true,
    config: {
      siteVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    },
  },
  naverSearchAdvisor: {
    enable: true,
    config: {
      siteVerification: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || "",
    },
  },
  utterances: {
    enable: true,
    config: {
      repo: process.env.NEXT_PUBLIC_UTTERANCES_REPO || "",
      "issue-term": "og:title",
      label: "💬 Utterances",
    },
  },
  isProd: process.env.VERCEL_ENV === "production", // distinguish between development and production environment (ref: https://vercel.com/docs/environment-variables#system-environment-variables)
  revalidateTime: 60, // revalidate time for [slug], index
}

module.exports = { CONFIG }
