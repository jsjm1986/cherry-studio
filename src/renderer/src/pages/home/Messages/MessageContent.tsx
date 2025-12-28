import type { Message } from '@renderer/types/newMessage'
import React from 'react'

import MessageBlockRenderer from './Blocks'
interface Props {
  message: Message
}

const MessageContent: React.FC<Props> = ({ message }) => {
  return <MessageBlockRenderer blocks={message.blocks} message={message} />
}

// const SearchingText = styled.div`
//   font-size: 14px;
//   line-height: 1.6;
//   text-decoration: none;
//   color: var(--color-text-1);
// `

export default React.memo(MessageContent)
