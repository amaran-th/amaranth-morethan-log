import { CONFIG } from "site.config"
import { useEffect } from "react"
import styled from "@emotion/styled"
import useScheme from "src/hooks/useScheme"

type Props = {
  issueTerm: string
}

const Utterances: React.FC<Props> = ({ issueTerm }) => {
  const [scheme] = useScheme()

  useEffect(() => {
    const theme = `github-${scheme}`
    const script = document.createElement("script")
    const anchor = document.getElementById("comments")
    if (!anchor) return

    script.setAttribute("src", "https://utteranc.es/client.js")
    script.setAttribute("crossorigin", "anonymous")
    script.setAttribute("async", `true`)
    script.setAttribute("issue-term", issueTerm)
    script.setAttribute("theme", theme)
    const config: Record<string, string> = CONFIG.utterances.config
    Object.keys(config).forEach((key) => {
      script.setAttribute(key, config[key])
    })
    // utterances' client.js inserts its iframe next to its own <script> tag
    // once it runs. If cleanup detaches a script that is still loading (theme
    // settling after mount, or moving to another post), it throws "The element
    // has no parent". Keep each script inside its own wrapper and remove the
    // wrapper instead, so the script always has a parent.
    const container = document.createElement("div")
    container.appendChild(script)
    anchor.appendChild(container)
    return () => {
      container.remove()
    }
  }, [scheme, issueTerm])
  return (
    <>
      <StyledWrapper id="comments" />
    </>
  )
}

export default Utterances

const StyledWrapper = styled.div`
  @media (min-width: 768px) {
    margin-left: -4rem;
  }
`
