import dynamic from "next/dynamic"
import { CONFIG } from "site.config"
import { TPost } from "src/types"

const UtterancesComponent = dynamic(
  () => {
    return import("./Utterances")
  },
  { ssr: false }
)

type Props = {
  data: TPost
}

const CommentBox: React.FC<Props> = ({ data }) => {
  return (
    <div>
      {CONFIG.utterances.enable && <UtterancesComponent issueTerm={data.id} />}
    </div>
  )
}

export default CommentBox
