'use client'

import { useState } from 'react'
import { MessageSquare, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ElementComment } from '@/lib/types'

interface CommentsSidebarProps {
  elementId: string | null
  comments: ElementComment[]
  onAddComment: (elementId: string, author: string, text: string) => Promise<void>
  onDeleteComment: (commentId: string) => Promise<void>
  currentUserName: string
}

export function CommentsSidebar({ elementId, comments, onAddComment, onDeleteComment, currentUserName }: CommentsSidebarProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  if (!elementId) return null

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    await onAddComment(elementId, currentUserName, text.trim())
    setText('')
    setSending(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare size={14} className="text-zinc-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Comentários</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {comments.length === 0 && (
          <p className="text-xs text-zinc-600">Nenhum comentário neste elemento.</p>
        )}
        {comments.map(comment => (
          <div key={comment.id} className="bg-zinc-800 rounded p-2 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-zinc-300">{comment.author_name}</span>
              <div className="flex items-center gap-1">
                <span className="text-zinc-600">{new Date(comment.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                <button
                  onClick={() => onDeleteComment(comment.id)}
                  className="text-zinc-600 hover:text-red-400 ml-1"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
            <p className="text-zinc-400">{comment.text}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Comentar..."
          className="h-8 text-xs bg-zinc-800 border-zinc-700"
          onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
        />
        <Button size="icon" className="h-8 w-8 flex-shrink-0" onClick={handleSend} disabled={sending}>
          <Send size={14} />
        </Button>
      </div>
    </div>
  )
}
